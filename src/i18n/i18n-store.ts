import {createInstance, i18n} from "i18next";
import type {InitOptions} from "i18next";
import {NdTranslatedText} from "nodoku-core";
import {
    OnFallbackLngTextUpdateStrategyImpl,
    SimplelocalizeBackendApiClient
} from "./simplelocalize/simplelocalize-backend-api-client";

const delay = (ms: number) => new Promise(res => setTimeout(res, ms));

export type LanguageNsTranslationResource = {[key: string]: string}

export type LanguageTranslationResource = { [key: string]: {
        [key: string]: LanguageNsTranslationResource;
    }
};

export type AllLanguagesAllNamespacesTranslationResource = { [key: string]: {
        [key: string]: LanguageTranslationResource;
    }
};

export type UpdatedKey = {language: string; namespace: string; key: string}

export type MissingKeyHandler = (lngs: readonly string[],
                                 ns: string,
                                 key: string,
                                 fallbackValue: string,
                                 updateMissing: boolean,
                                 options: any) => void;

export type FallbackLanguageValueChangeHandler = (language: string, namespace: string, key: string, text: string) => void;

export type TranslationResourceLoader = (allLng: readonly string[], allNs: readonly string[]) => Promise<AllLanguagesAllNamespacesTranslationResource>;

export class I18nStore {

    private static sharedI18n: i18n | undefined = undefined;


    static async initStore(allLngs: readonly string[],
                           nampespaces: readonly string[],
                           fallbackLng: string,
                           saveMissing: boolean,
                           onFallbackLngTextUpdateStrategy: OnFallbackLngTextUpdateStrategyImpl,
                           resourceLoader: TranslationResourceLoader,
                           missingKeyHandler: MissingKeyHandler): Promise<void> {

        // if (this.sharedI18n != undefined) {
        //     return;
        // }

        this.sharedI18n = await I18nStore.createAndInitI18next(allLngs, nampespaces, fallbackLng, saveMissing, resourceLoader, missingKeyHandler);

        // await I18nStore.reloadResources();

        SimplelocalizeBackendApiClient.onFallbackLngTextUpdateStrategy = onFallbackLngTextUpdateStrategy;
        setInterval(SimplelocalizeBackendApiClient.pushMissingKeys, 10000)


    }

    private static async createAndInitI18next(allLngs: readonly string[],
                                              namespaces: readonly string[],
                                              fallbackLng: string,
                                              saveMissing: boolean,
                                              translationToResource: TranslationResourceLoader,
                                              missingKeyHandler: MissingKeyHandler): Promise<i18n> {

        const i18nInstance: i18n = createInstance()
        const options = await I18nStore.createOptions(allLngs, namespaces, fallbackLng, saveMissing, translationToResource, missingKeyHandler);
        await i18nInstance.init(options)
        i18nInstance.languages = allLngs;
        return i18nInstance;
    }


    public static async reloadResources() {

        if (this.sharedI18n) {

            const options = this.sharedI18n.options;//await I18nStore.createOptions(lng, namespaces, fallbackLng, translationToResource, missingKeyHandler);
            const namespaces = Array.isArray(options.ns) ? options.ns || [] : [options.ns];
            const fallbackLng: string = Array.isArray(options.fallbackLng) ? options.fallbackLng[0] : options.fallbackLng;
            const translationToResource = (options as {translationToResource: TranslationResourceLoader}).translationToResource;

            options.resources = await translationToResource(this.sharedI18n.languages, namespaces);//this.loadTranslations(this.sharedI18n.languages, namespaces/*, fallbackLng*/, translationToResource);
            await this.sharedI18n.init(options)

            console.log("loaded translation resources for ", this.sharedI18n.languages, fallbackLng)

        }

    }

    private static async createOptions(allLngs: readonly string[],
                                       namespaces: readonly string[],
                                       fallbackLng: string,
                                       saveMissing: boolean,
                                       translationToResource: TranslationResourceLoader,
                                       missingKeyHandler: MissingKeyHandler): Promise<InitOptions & {translationToResource: TranslationResourceLoader}> {


        return {
            // debug: true,
            resources: {},
            fallbackLng: fallbackLng,
            supportedLngs: allLngs,
            lng: fallbackLng,
            ns: namespaces,
            saveMissing: saveMissing,
            preload: false,
            updateMissing: false,
            translationToResource: translationToResource,
            missingKeyHandler: missingKeyHandler
        }
    }

    static translate(lng: string, ns: string, key: string): string {
        if (!this.sharedI18n) {
            return "translation n/a";
        }
        return this.sharedI18n.getFixedT(lng, ns)(key);
    }

    private static translateTranslatableText(lng: string,
                                             onFallbackLanguageValueChange: FallbackLanguageValueChangeHandler,
                                             text: NdTranslatedText, ): string {

        if (this.sharedI18n) {

            const fallbackLng: string = Array.isArray(this.sharedI18n.options.fallbackLng) ? this.sharedI18n.options.fallbackLng[0] : this.sharedI18n.options.fallbackLng;

            /*
             * make sure the fallback lng translation is intercepted by the missing key handler and eventually written to backend
             */
            const fallbackText = text.excludeFromTranslation ? I18nStore.wrapInBraces(text.text.trim()) : text.text.trim();
            const existingFallback: string = this.sharedI18n.getFixedT(fallbackLng, text.ns)(text.key, fallbackText)

            if (existingFallback !== fallbackText) {
                console.log("detected translation change: ", existingFallback, fallbackText)
                onFallbackLanguageValueChange(fallbackLng, text.ns, text.key, fallbackText)
            }

            const details = this.sharedI18n.getFixedT(lng, text.ns)(text.key, {returnDetails: true})
            // console.log(">>>>>>>.... details", this.unwrapFromBraces(details.res), details, existingFallback)
            const translationExists = details.usedLng === lng && details.res && details.res.length > 0;
            if (translationExists) {
                return I18nStore.unwrapFromBraces(details.res);
            } else if (text.excludeFromTranslation && existingFallback.length > 0) {
                return I18nStore.unwrapFromBraces(existingFallback);
            }

            return I18nStore.decorateUntranslated(lng, text, existingFallback);
        } else {
            return `${lng}.{${text.ns}:${text.key}}`
        }

    }

    static async i18nForNodokuImpl(lng: string, fallbackLanguageValueChangeHandler: FallbackLanguageValueChangeHandler):
        Promise<{t: (text: NdTranslatedText) => string}> {

        return {
            t: (text: NdTranslatedText) => I18nStore.translateTranslatableText(lng, fallbackLanguageValueChangeHandler, text)
        }

    }

    private static wrapInBraces(text: string): string {
        if (text.length == 0) {
            return text;
        }
        return `{${text}}`
    }

    private static unwrapFromBraces(text: string): string {
        if (text.length == 0) {
            return text;
        }
        if (text.startsWith("{") && text.endsWith("}")) {
            return text.substring(1, text.length - 1);
        }
        return text;
    }

    private static decorateUntranslated(lng: string, text: NdTranslatedText, existingFallback: string) {
        return `<small style="font-size: 12px">n/a ${lng}:${text.ns}:${text.key}</small>[${existingFallback}]`;
    }

}


