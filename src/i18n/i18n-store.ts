import {createInstance, i18n} from "i18next";
import type {InitOptions} from "i18next";
import {NdTranslatableText} from "nodoku-core";
import {
    OnFallbackLngTextUpdateStrategyImpl,
    SimplelocalizeBackendApiClient
} from "./simplelocalize/simplelocalize-backend-api-client";

export const delay = (ms: number) => new Promise(res => setTimeout(res, ms));

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
    private static isInitStarted: boolean = false;


    static async initStore(allLngs: readonly string[],
                           nampespaces: readonly string[],
                           fallbackLng: string,
                           saveMissing: boolean,
                           onFallbackLngTextUpdateStrategy: OnFallbackLngTextUpdateStrategyImpl,
                           resourceLoader: TranslationResourceLoader,
                           missingKeyHandler: MissingKeyHandler): Promise<void> {

        if (I18nStore.sharedI18n != undefined) {
            await I18nStore.reloadResources(I18nStore.sharedI18n);
            return;
        }

        if (I18nStore.isInitStarted) {
            let k = 200;
            while (k-- >= 0 && I18nStore.sharedI18n == undefined) {
                await delay(1000);
            }
            if (I18nStore.sharedI18n == undefined) {
                throw new Error("has been waiting for initialization, but failed...");
            }
            return;
        }

        I18nStore.isInitStarted = true;

        const instanceInCreation: i18n =  await I18nStore.createAndInitI18next(allLngs, nampespaces, fallbackLng, saveMissing, resourceLoader, missingKeyHandler);

        await I18nStore.reloadResources(instanceInCreation);

        SimplelocalizeBackendApiClient.onFallbackLngTextUpdateStrategy = onFallbackLngTextUpdateStrategy;
        setInterval(SimplelocalizeBackendApiClient.pushMissingKeys, 10000)

        I18nStore.sharedI18n = instanceInCreation;
        I18nStore.isInitStarted = false;

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
        // i18nInstance.languages = allLngs;
        return i18nInstance;
    }


    public static async reloadResources(i18n: i18n | undefined = undefined): Promise<void> {

        const i18nInstance: i18n | undefined = i18n == undefined ? I18nStore.sharedI18n : i18n;

        if (/*I18nStore.sharedI18n*/i18nInstance) {

            const options = /*I18nStore.sharedI18n*/i18nInstance.options;//await I18nStore.createOptions(lng, namespaces, fallbackLng, translationToResource, missingKeyHandler);
            const namespaces = Array.isArray(options.ns) ? options.ns || [] : [options.ns];
            const fallbackLng: string = Array.isArray(options.fallbackLng) ? options.fallbackLng[0] : options.fallbackLng;
            const translationToResource = (options as {translationToResource: TranslationResourceLoader}).translationToResource;

            // options.resources = await translationToResource(I18nStore.sharedI18n.languages, namespaces);
            options.resources = await translationToResource(options.supportedLngs as readonly string[], namespaces);
            await /*I18nStore.sharedI18n*/i18nInstance.init(options)

            console.log("loaded translation resources for ", (options.supportedLngs as string[]).join(", "), fallbackLng)

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
            preload: allLngs,
            updateMissing: saveMissing,
            translationToResource: translationToResource,
            missingKeyHandler: missingKeyHandler
        }
    }

    static translate(lng: string, ns: string, key: string): string {
        if (!I18nStore.sharedI18n) {
            return "translation n/a";
        }
        return I18nStore.sharedI18n.getFixedT(lng, ns)(key);
    }

    private static translateTranslatableText(lng: string,
                                             onFallbackLanguageValueChange: FallbackLanguageValueChangeHandler,
                                             text: NdTranslatableText, ): string {

        if (I18nStore.sharedI18n) {

            const fallbackLng: string = Array.isArray(I18nStore.sharedI18n.options.fallbackLng) ?
                I18nStore.sharedI18n.options.fallbackLng[0] : I18nStore.sharedI18n.options.fallbackLng;

            /*
             * make sure the fallback lng translation is intercepted by the missing key handler and eventually written to backend
             */
            const fallbackText = text.excludeFromTranslation ? I18nStore.wrapInBraces(text.text.trim()) : text.text.trim();
            const existingFallback: string = I18nStore.sharedI18n.getFixedT(fallbackLng, text.ns)(text.key, fallbackText)

            if (existingFallback !== fallbackText) {
                console.log("detected translation change: ", existingFallback, fallbackText)
                onFallbackLanguageValueChange(fallbackLng, text.ns, text.key, fallbackText)
            }

            const details = I18nStore.sharedI18n.getFixedT(lng, text.ns)(text.key, {returnDetails: true})
            // console.log(">>>>>>>.... details", this.unwrapFromBraces(details.res), details, existingFallback)
            const translationExists = details.usedLng === lng && details.res && details.res.length > 0;
            if (translationExists) {
                // console.log("text is included in translation")
                return I18nStore.unwrapFromBraces(details.res);
            } else if (text.excludeFromTranslation && existingFallback.length > 0) {
                // console.log("text is excluded from translation")
                return I18nStore.unwrapFromBraces(existingFallback);
            }

            return I18nStore.decorateUntranslated(lng, text, existingFallback);
        } else {
            return `${lng}.{${text.ns}:${text.key}}`
        }

    }

    static async i18nForNodokuImpl(lng: string, fallbackLanguageValueChangeHandler: FallbackLanguageValueChangeHandler):
        Promise<{t: (text: NdTranslatableText) => string}> {

        return {
            t: (text: NdTranslatableText) => I18nStore.translateTranslatableText(lng, fallbackLanguageValueChangeHandler, text)
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

    private static decorateUntranslated(lng: string, text: NdTranslatableText, existingFallback: string) {
        return `<small style="font-size: 12px">n/a ${lng}:${text.ns}:${text.key}</small>[${existingFallback}]`;
    }

}


