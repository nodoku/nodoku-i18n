<!-- TOC -->
* [Getting started](#getting-started)
  * [Installing Nodoku localization](#installing-nodoku-localization)
  * [Integrating localization in the project](#integrating-localization-in-the-project)
  * [The localization language for Nodoku rendering](#the-localization-language-for-nodoku-rendering)
* [Nodoku localization foundation](#nodoku-localization-foundation)
  * [Parsing and translation key generation](#parsing-and-translation-key-generation)
  * [The content language](#the-content-language)
  * [Dealing with mutating translation keys](#dealing-with-mutating-translation-keys)
* [i18next](#i18next)
* [Simplelocalize backend](#simplelocalize-backend)
  * [Creating a project in Simplelocalize](#creating-a-project-in-simplelocalize)
  * [Initializing the backend](#initializing-the-backend)
    * [Blocking initialization](#blocking-initialization-)
    * [The namespaces](#the-namespaces)
    * [The fallback language](#the-fallback-language)
  * [Specifying the i18nextProvider](#specifying-the-i18nextprovider-)
  * [Interaction with the cloud storage](#interaction-with-the-cloud-storage)
    * [Initial translation upload](#initial-translation-upload)
    * [Managing translations](#managing-translations)
    * [Managing the content change](#managing-the-content-change)
      * [Updating the fallback language text](#updating-the-fallback-language-text)
      * [Deleting all the translations](#deleting-all-the-translations)
      * [Deleting all the translations](#deleting-all-the-translations-1)
<!-- TOC -->

nodoku-i18n is a localization library for [Nodoku static site generator](https://github.com/nodoku/nodoku-core).

One of the parameter Nodoku RenderingPage component receives is the localization function - ```imageUrlProvider: ImageUrlProvider | undefined```.

This parameter is optional. If not provided, the text from the content MD file is used.

The localization function has the following signature:

```ts
type I18nextProvider = (lng: string) => Promise<{t: (text: NdTranslatedText) => string}>;
```

For a given language, _I18nextProvider_ function is supposed to return a structure containing the **_t()_**  function, which later will be used for the page localization.

> ```(text: NdTranslatedText) => string```


The Nodoku components are localized out of the box, so if the _I18nextProvider_ defined in the _RenderingPage_ call, its **_t()_** function will be used throughout all the textual content 

Note that even the image url's can be localized. By default, the translation value for the image url's are supplied wrapped in curly braces

> ```{../images/my-image.png}```

Curly braces usually mean that the value shouldn't be translated by the automatic translation, if a localization backend, such as [Simplelocalize](https://simplelocalize.io/) or [Locize](https://locize.com/), is used.

See below for more details.


# Getting started

## Installing Nodoku localization

The installation is straightforward:

```shell
npm install nodoku-core nodoku-i18n
```

## Integrating localization in the project

Nodoku localization integration consists of two phases:

- initializing the localization store
  ```ts
  import {NodokuI18n} from "nodoku-i18n";
  ...
  await NodokuI18n.Simplelocalize.initI18nStore( ["nodoku-landing", "docs", "faq"], 'en')
  ```
  The parameters to the translation store initialization are specific to the backend which is chosen for translation. See below for details about this example.


- calling the RenderingPage Nodoku component with the localization function ```NodokuI18n.Simplelocalize.i18nForNodoku```
  ```tsx
  return (
      <RenderingPage
          lng={lng}
          renderingPriority={RenderingPriority.skin_first}
          skin={skin}
          content={content}
          i18nextProvider={NodokuI18n.Simplelocalize.i18nForNodoku}
          imageUrlProvider={imageUrlProvider}
          componentResolver={nodokuComponentResolver}
      />
  );

  ```
  
See below for details about the translation backend Simplelocalize, which is used in this example


## The localization language for Nodoku rendering

The Nodoku RenderingPage component receives as a **_mandatory parameter the language, in which the page should be displayed_**. 

> **_lng_** - the attribute telling Nodoku in which language the page should be displayed.

Don't confuse it with the language the content is provided in MD file.

The content language is provided during parsing, as a parameter to the parser (see [Parsing and translation key generation](#parsing-and-translation-key-generation) for details on parsing).

Whereas the **_lng_** parameter is given to the _RenderingPage_ to display the content in the desired language.

Nodoku will automatically use the provided backend  to get the translations, so that the visual content is rendered in the desired language.

> **_Important_**: The localization discussed here is the Server Side localization, i.e. the localization that would be happening during Server Side Rendering of NextJS. Hence, the **_lng_** parameter should be available at the time of building. 

One of the possible solutions is to use the NextJS static page parametrization, as follows:

```text
src
    app
        [lng]
            page.tsx
```

And the page is accessed using the language parameter in the URL
```text
https://www.my-domain.com/en/
```

If this approach is used, one should provide the static params provider - **_[generateStaticParams](https://nextjs.org/docs/app/api-reference/functions/generate-static-params)_**, as follows (or in a similar way):

```ts
export async function generateStaticParams(): Promise<{ params: { lng: string } }[]> {
  return (await NodokuI18n.Simplelocalize.allLanguages()).map(l => {
    return {params: {lng: l.key}};
  });
}

```


# Nodoku localization foundation

## Parsing and translation key generation

A textual information unit in Nodoku is a structure represented by the class ```NdTranslatedText```

```ts
export class NdTranslatedText {
    key: string = "";
    ns: string = "";
    text: string = "";
}
```

This structure is intended to contain a single piece of _translatable_ textual content.

And the attributes has the following meaning:
- **_key_**: the translation key of the piece of text
- **_ns_**: the translation namespace of the piece of text
- **_text_**: the actual textual content, as it has been extracted from the MD file during parsing.

This structure is created during the MD file parsing, where each title, paragraph and image are extracted and stored in such a way.

Upon MD file parsing we extract the textual content, and it is stored in the _text_ field.

The namespace (the _ns_ attribute) is provided as a parameter to the parsing function. 

And finally, the translation key (the _key_ attribute) is generated automatically, using the content block id as a prefix.

Consider the following example:

```markdown

```yaml
nd-block:
  attributes:
    sectionName: nodoku-way
``

# Step 1: _Think_
## Create content promoting your product or service as an **MD file**

```

We are parsing it the following call to parser:

```ts
const content: NdContentBlock[] = await contentMarkdownProvider("http://localhost:3001/site/nodoku-landing.md", "en", "nodoku-landing")
```

As you can see, we are directly specifying the language in which the content is written - _"en"_, as well as the namespace - _"nodoku-landing"_, to which the content will be assigned.



This would end up in the following data structure:

```json
[
  {
    "key": "sectionName=nodoku-way-block-0.title",
    "ns": "nodoku-landing",
    "text": "Step 1: <em>Think</em>"
  },
  {
    "key": "sectionName=nodoku-way-block-0.subTitle",
    "ns": "nodoku-landing",
    "text": "Create content promoting your product or service as an <strong>MD file</strong>"
  }

]
```

The translation keys are automatically generated using the meta attributes of the content block, the sequential index of the content block in the stream and the name of the actual content block attribute this translation is assigned to ("title", "subTitle").  


## The content language

One of the parameters given to the content provider is the language, in which the content is written.

The Nodoku localization mechanism doesn't translate the content, if the requested language corresponds to the content language.

Indeed, if the content is already supplied in the required language, no translation is needed.

This principle is also important since otherwise the same content would have been presented twice - in the content MD file, and in the translation backend.

To avoid this "brain split" the content language should be specified, and it is taken into account in the **_t()_** function to bypass the translation, if the page language corresponds to the content language. 


## Dealing with mutating translation keys

The Nodoku localization, as any other localization, is heavily dependent on the translation keys, to which a piece of textual content is assigned.

And the translation keys in turn are relying on the content **_blockId_**, since this is the prefix of each translation key for the given content block.

Such approach might pose a problem, when the content _blockId_ changes.

If it does, all the associated translation keys will be changed as well, and the backend wouldn't be able to provide it.

Consider the following example:

```markdown

```yaml
nd-block:
  attributes:
    sectionName: nodoku-way
``

# Step 1: Think

# Step 2: Skin

```

As has shown above, this would generate the following translation keys:

> - sectionName=nodoku-way-block-0.title
>   - corresponds to the text: Step 1: Think 
> - sectionName=nodoku-way-block-1.title
>   - corresponds to the text: Step 2: Skin

if for some reason the sections are exchanged in their order in the markdown file, as follows:

```markdown

```yaml
nd-block:
  attributes:
    sectionName: nodoku-way
``

# Step 2: Skin

# Step 1: Think

```

the correspondence between the translation keys and the text would be changed:

> - sectionName=nodoku-way-block-0.title
>   - corresponds to the text: Step 2: Skin
> - sectionName=nodoku-way-block-1.title
>   - corresponds to the text: Step 1: Think

This happens because the automatic generation of the translation keys is based on the sequential order of the content blocks in the MD file.

If the backend already contained the translations for these keys, these translations would not be correct anymore, since the underlying text had changed.

Below we'll see the strategies to handle this kind of problem.

However, one should be aware of the consequences of changing the order of textual blocks.


# i18next

The **_nodoku-i18n_** is based on the well-known and highly popular library **_[i18next](https://github.com/i18next/i18next)_**

This library allows loading and storing translation resources, and it manages both the current language and the fallback language.

The Nodoku localization - nodoku-i18n - takes care of creating the required instances of i18next, one per localization languages.

Note, that during the NextJS build process all the pages in different languages are built at the same time, in parallel.

Therefore, it is very important to maintain a separate instance of i18n for each page language being built.

# Simplelocalize backend

[Simplelocalize](https://simplelocalize.io/) is a company providing a cloud based solution to the localization.

It has a backend web interface, where the localization can be managed.

**_nodoku-i18n_** provides an adapter for this backend

## Creating a project in Simplelocalize

Prior to use the Simplelocalize backend, one needs to create an account, and a localization project.

Once this is done, the **_.env.local_** should be modified to contain the project and API keys of the localization project, as follows:

> SIMPLELOCALIZE_API_KEY=<my-project-api-key>
> 
> SIMPLELOCALIZE_PROJECT_TOKEN=<my-project-token>

The Simplelocalize adapter, provided in nodoku-i18n, is relying on these environment variables to connect to the backend.

The keys are available in the account on Simplelocalize as follows:
1. login to Simplelocalize
2. in the Dashboard click on the project
3. Go to Settings -> Credentials
4. Copy the API key and the project token to the **_.env.local_**, as has been shown above

## Initializing the backend

Prior to using the Simplelocalize Nodoku backend, one needs to initialize it as follows:

```ts
await NodokuI18n.Simplelocalize.initI18nStore( ["<list of namespaces>"], "<the fallback language>")
```

for example:

```ts
await NodokuI18n.Simplelocalize.initI18nStore( ["nodoku-landing", "faq", "docs"], "en")
```

Several things are important here:

### Blocking initialization 

Note the keyword _await_ in front of the call to the translation backend initialization. 

The **_t()_** used for content translation in the Nodoku components is a synchronous call. 

In other words, all the translation resources, that might be needed for the execution of this funciton - translation keys and namespaces for the given language - should be preloaded, and readily available at the moment of rendering.

Therefore, the backend initialization is naturally asynchronous, as it includes preloading of the translation resources.

The call should be blocking, since we cannot start rendering prior to the resources being fully loaded.


### The namespaces

The list of namespaces should be exhaustive.

For the same reason, we need to know in advance all the namespaces for which the translation resources should be loaded.

### The fallback language

The third parameter this call accepts is the fallback language.

The fallback language in case of Nodoku indicates the language, which should not be translated. 

This language should correspond to the language of the MD file content.

Recall, that this language is given as a parameter to the parser to extract the content blocks.

Here is an example:

```ts
const content: NdContentBlock[] = await contentMarkdownProvider("https://my-project-backend.com/site/nodoku-landing.md", "en", "nodoku-landing")

await NodokuI18n.Simplelocalize.initI18nStore( ["nodoku-landing"], "en")
```

Note that the content language, given to the content provider - "en" - precisely corresponds to the fallback language, with which the Nodoku localization backend is initialized.

As has been mentioned above, Nodoku doesn't translate the text content if it is already supplied in the required language (in the source MD file).

As we'll see later this parameter is required and important, but for now it is important to note that
> **_the translation backend fallback language should correspond to the content language_**


## Specifying the i18nextProvider 

The attribute i18nextProvider is an entry point for the RenderingPage Nodoku component, as far as localization is concerned:

```tsx
<RenderingPage
        lng={lng}
        renderingPriority={RenderingPriority.skin_first}
        skin={skin}
        content={content}
        i18nextProvider={NodokuI18n.Simplelocalize.i18nForNodoku}
        imageUrlProvider={imageUrlProvider}
        componentResolver={nodokuComponentResolver}
/>
```

The Nodoku Simplelocalize backend provides this function readily available to be used in the RenderingPage component.

## Interaction with the cloud storage

Once the Nodoku translation backend is initialized and rendering is started, the Nodoku adapter will start initeracting with the cloud backend.

### Initial translation upload

At the first run, when no resources are yet available, the content is being uploaded to the cloud storage for each translation key encountered during rendering.

This is happening thanks to the [missing keys handler](https://www.i18next.com/overview/configuration-options#missing-keys), supplied as a parameter during i18next initialization.

This is done automatically, and the user should not be worrying about that.

Thanks to the fact that the fallback language has been provided during Nodoku translation backend initialization, the text for the translation keys is uploaded on the correct language.

> This is why it is important to specify the fallback language to be equivalent to the content language.

### Managing translations

Once the initial translation in the default language has been uploaded, the user can start providing the translation.

They can use either manual or automatic translations, using the web interface of the backend.

In the dev environment, the API is used to obtain the translation resources. 

Whereas on production normally the CDN resources are used, and translation publishing is required.

### Managing the content change

It might so happen, due to the modification of the MD file, that the text initially uploaded to the translation cloud backend, is changed.

Recall, that this problem has been discussed in [Dealing with mutating translation keys](#dealing-with-mutating-translation-keys)

This change should be reflected, and Nodoku backend provides several strategies to deal with that.

The strategy is specified as a parameter to the Nodoku initialization function.

Three strategies are currently available:

#### Updating the fallback language text

key: ```OnFallbackLngTextUpdateStrategy.update_fallback_lng_only```

This strategy uploads the new text to the given translation key on the fallback language.

Further manual review process might be required to ensure, the translation still correspond to the modified text.

#### Deleting all the translations

key: ```OnFallbackLngTextUpdateStrategy.delete_translations```


This strategy, in addition to the text update on the fallback language,  would delete any existing translations, that might be available on other languages.

This way the user is forced to provide again the new translations for modified text.

#### Deleting all the translations

key: ```OnFallbackLngTextUpdateStrategy.reset_reviewed_status```


This strategy, in addition to the text update on the fallback language, would leave the existing translations intact.

Rather, it would reset the "Reviewed" flag on Simplelocalize backend.

The user can then use the filtering mechanism to search for translations that need to be verified.


