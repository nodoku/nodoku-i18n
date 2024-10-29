<!-- TOC -->
* [Getting started](#getting-started)
  * [Installing Nodoku localization](#installing-nodoku-localization)
  * [Integrating localization in the project](#integrating-localization-in-the-project)
  * [The localization language for Nodoku rendering](#the-localization-language-for-nodoku-rendering)
* [Nodoku localization foundation](#nodoku-localization-foundation)
  * [Parsing and translation key generation](#parsing-and-translation-key-generation)
  * [Coping with mutating translation keys](#coping-with-mutating-translation-keys)
* [i18next](#i18next)
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

A textual information uni in Nodoku is a structure represented by the class ```NdTranslatedText```

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

The translation keys are automatically generated using the meta attributes of the content block, the sequential index of the content block in the stream and the name of the name of the actual content block attribute this translation is assigned to ("title", "subTitle").  


## Coping with mutating translation keys

the NOdoku localization is heavily dependent on the translation keys, to which a piece of textual content is assigned.

And the translation keys in turn are relying on the content blockId, since this is a prefix of each translation key for the given content block.

Such approach might pose a problem, when the content blockId changes.

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

As has shown above, this would generate translation keys:

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

If the backend contained the translations for these keys already, these translations would not be correct anymore, since the underlying text had changed.

Below we'll see the strategies to handle this kind of problem.

However, one should be aware of the consequences of changing the order of textual blocks.


# i18next

The nodoku-i18n is based on the well-known and largely used library **_[i18next](https://github.com/i18next/i18next)_**

This library allows loading and storing translation resources, as well as it manages the current language and the fallback language.





