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

export type UpdatedKey = {language: string; namespace: string; key: string}

export type MissingKeyHandler = (lngs: readonly string[],
                                 ns: string,
                                 key: string,
                                 fallbackValue: string,
                                 updateMissing: boolean,
                                 options: any) => void;

export type FallbackLanguageValueChangeHandler = (language: string, namespace: string, key: string, text: string) => void;

export type TranslationResourceLoader = (lng: string, ns: string) => Promise<LanguageNsTranslationResource>;

export class I18nStore {

    private static i18nByLang: Map<string, i18n> = new Map();

    static getI18nByLangByNs(lng: string): i18n | undefined {
        return I18nStore.i18nByLang.get(lng);
    }

    static getAllI18n(): i18n[] {
        return Array.from(I18nStore.i18nByLang.values())
    }

    static async initStore(allLlngs: readonly string[],
                           nampespaces: readonly string[],
                           fallbackLng: string,
                           onFallbackLngTextUpdateStrategy: OnFallbackLngTextUpdateStrategyImpl,
                           resourceLoader: TranslationResourceLoader,
                           missingKeyHandler: MissingKeyHandler) {


        for (const lng of allLlngs) {
            if (lng !== fallbackLng) {
                await I18nStore.initStoreForLng(lng, nampespaces, fallbackLng,
                    resourceLoader,
                    missingKeyHandler);
            }
        }

        await I18nStore.reloadResources();

        console.log("loaded i18n's :", Array.from(I18nStore.i18nByLang.values()).map((i: i18n) => {return {
            lng: i.language,
            loaded: i.hasLoadedNamespace(nampespaces)}}))

        SimplelocalizeBackendApiClient.onFallbackLngTextUpdateStrategy = onFallbackLngTextUpdateStrategy;
        setInterval(SimplelocalizeBackendApiClient.pushMissingKeys, 10000)


    }

    private static async initStoreForLng(lng: string, nampespaces: readonly string[], fallbackLng: string,
                           resourceLoader: TranslationResourceLoader,
                           missingKeyHandler: MissingKeyHandler): Promise<void> {

        if (I18nStore.i18nByLang.has(lng)) {
            return;
        }

        const i18n = await I18nStore.createAndInitI18next(lng, nampespaces, fallbackLng, resourceLoader, missingKeyHandler);

        console.log("loaded i18n", lng/*, i18n.store.data*/)

        I18nStore.i18nByLang.set(lng, i18n);

    }

    private static async createAndInitI18next(lng: string, namespaces: readonly string[], fallbackLng: string,
                                     translationToResource: TranslationResourceLoader,
                                     missingKeyHandler: MissingKeyHandler): Promise<i18n> {

        const i18nInstance: i18n = createInstance()
        const options = await I18nStore.createOptions(lng, namespaces, fallbackLng, translationToResource, missingKeyHandler);
        await i18nInstance.init(options)
        return i18nInstance
    }


    public static async reloadResources() {

        for (const i18n of Array.from(I18nStore.i18nByLang.values())) {

            const options = i18n.options;//await I18nStore.createOptions(lng, namespaces, fallbackLng, translationToResource, missingKeyHandler);
            const lng = i18n.languages[0];
            const namespaces = Array.isArray(options.ns) ? options.ns || [] : [options.ns];
            const fallbackLng: string = Array.isArray(options.fallbackLng) ? options.fallbackLng[0] : options.fallbackLng;
            const translationToResource = (options as {translationToResource: TranslationResourceLoader}).translationToResource;

            options.resources = await this.loadTranslations(lng, namespaces, fallbackLng, translationToResource);
            await i18n.init(options)

            console.log("loaded translation resources for ", lng, fallbackLng)

            await delay(100);
        }


    }



    private static async loadTranslations(lng: string,
                                          namespaces: readonly string[],
                                          fallbackLng: string,
                                          translationToResource: TranslationResourceLoader): Promise<LanguageTranslationResource> {
        const languageTranslationResource: LanguageTranslationResource = {};

        for (const ns of namespaces) {
            languageTranslationResource[lng] = {};
            languageTranslationResource[lng][ns] = await translationToResource(lng, ns)
            languageTranslationResource[fallbackLng] = {};
            languageTranslationResource[fallbackLng][ns] = await translationToResource(fallbackLng, ns)
        }

        return languageTranslationResource;
    }

    private static async createOptions(lng: string, namespaces: readonly string[], fallbackLng: string,
                                       translationToResource: TranslationResourceLoader,
                                       missingKeyHandler: MissingKeyHandler): Promise<InitOptions & {translationToResource: TranslationResourceLoader}> {


        return {
            // debug: true,
            // supportedLngs: languages,
            resources: {},
            fallbackLng: fallbackLng,
            supportedLngs: [fallbackLng, lng],
            lng,
            ns: namespaces,
            saveMissing: true,//fallbackLng === lng,
            translationToResource: translationToResource,
            missingKeyHandler: missingKeyHandler
        }
    }

    static translate(lng: string, ns: string, key: string): string {
        const i18n = I18nStore.i18nByLang.get(lng);
        if (!i18n) {
            return "translation n/a";
        }
        const t = i18n.getFixedT(lng, ns)
        return t(key);
    }

    private static translateNdTranslatedText(lng: string,
                                             onFallbackLanguageValueChange: FallbackLanguageValueChangeHandler,
                                             text: NdTranslatedText, ): string {

        const i18n: i18n | undefined = I18nStore.getI18nByLangByNs(lng);
        if (i18n) {

            const fallbackLng: string = Array.isArray(i18n.options.fallbackLng) ? i18n.options.fallbackLng[0] : i18n.options.fallbackLng;

            /*
             * make sure the fallback lng translation is intercepted by the missing key handler and eventually written to backend
             */
            const fallbackText = text.excludeFromTranslation ? I18nStore.wrapInBraces(text.text.trim()) : text.text.trim();
            const existingFallback: string = i18n.getFixedT(fallbackLng, text.ns)(text.key, fallbackText)

            if (existingFallback !== fallbackText) {
                console.log("detected translation change: ", existingFallback, fallbackText)
                onFallbackLanguageValueChange(fallbackLng, text.ns, text.key, fallbackText)
            }

            const details = i18n.getFixedT(lng, text.ns)(text.key, {returnDetails: true})
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
            t: (text: NdTranslatedText) => I18nStore.translateNdTranslatedText(lng, fallbackLanguageValueChangeHandler, text)
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


