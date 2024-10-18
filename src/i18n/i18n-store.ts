import {createInstance, i18n} from "i18next";
import resourcesToBackend from "i18next-resources-to-backend";
import type {InitOptions} from "i18next";
import {NdTranslatedText} from "nodoku-core";

export type LanguageNsTranslationResource = {[key: string]: string}

export type UpdatedKey = {language: string; namespace: string; key: string}

export type MissingKeyHandler = (lngs: readonly string[],
                                 ns: string,
                                 key: string,
                                 fallbackValue: string,
                                 updateMissing: boolean,
                                 options: any) => void;

export type TranslationResourceLoader = (lng: string, ns: string) => Promise<LanguageNsTranslationResource>;

export class I18nStore {

    private static i18nByLangByNs: Map<string, i18n> = new Map();

    static getI18nByLangByNs(lng: string): i18n | undefined {
        return I18nStore.i18nByLangByNs.get(lng);
    }

    static getAllLanguages(): string[] {
        return Array.from(I18nStore.i18nByLangByNs.keys());
    }

    static getAllI18n(): i18n[] {
        return Array.from(I18nStore.i18nByLangByNs.values())
    }

    static async initStore(lng: string, nampespaces: readonly string[], fallbackLng: string,
                           resourceLoader: TranslationResourceLoader,
                           missingKeyHandler: MissingKeyHandler): Promise<i18n> {

        const i18n = await I18nStore.createAndInitI18next(lng, nampespaces, fallbackLng, resourceLoader, missingKeyHandler);

        console.log("loaded i18n", lng, i18n.store.data)

        I18nStore.i18nByLangByNs.set(lng, i18n);

        return i18n;

    }

    private static async createAndInitI18next(lng: string, namespaces: readonly string[], fallbackLng: string,
                                     translationToResource: TranslationResourceLoader,
                                     missingKeyHandler: MissingKeyHandler): Promise<i18n> {



        const i18nInstance = createInstance()
        await i18nInstance
            // .use(resourcesToBackend(translationToResource))
            .init(await I18nStore.createOptions(lng, namespaces, fallbackLng, translationToResource, missingKeyHandler))
        return i18nInstance
    }

    private static async createOptions(lng: string, namespaces: readonly string[], fallbackLng: string,
                                       translationToResource: TranslationResourceLoader,
                                       missingKeyHandler: MissingKeyHandler): Promise<InitOptions> {

        const translationResources: { [key: string]: {
                [key: string]: LanguageNsTranslationResource;
            }
        } = {};

        for (const ns of namespaces) {
            translationResources[lng] = {};
            translationResources[lng][ns] = await translationToResource(lng, ns)
            translationResources[fallbackLng] = {};
            translationResources[fallbackLng][ns] = await translationToResource(fallbackLng, ns)
        }

        return {
            // debug: true,
            // supportedLngs: languages,
            resources: translationResources,
            fallbackLng: fallbackLng,
            supportedLngs: [fallbackLng, lng],
            lng,
            ns: namespaces,
            saveMissing: true,//fallbackLng === lng,
            missingKeyHandler: missingKeyHandler
        }
    }

    static translate(lng: string, ns: string, key: string): string {
        const i18n = I18nStore.i18nByLangByNs.get(lng);
        if (!i18n) {
            return "translation n/a";
        }
        const t = i18n.getFixedT(lng, ns)
        return t(key);
    }

    static async i18nForNodokuImpl(lng: string, onFallbackLanguageValueChange: (language: string, namespace: string, key: string, text: string) => void): Promise<{
        t: (text: NdTranslatedText) => string
    }> {

        return {
            t: (text: NdTranslatedText) => {
                const i18n: i18n | undefined = I18nStore.getI18nByLangByNs(lng/*, text.ns*/);
                if (i18n) {

                    const fallbackLng: string = Array.isArray(i18n.options.fallbackLng) ? i18n.options.fallbackLng[0] : i18n.options.fallbackLng;

                    /*
                     * make sure the fallback lng translation is intercepted by the missing key handler and eventually written to backend
                     */
                    const existingFallback: string = i18n.getFixedT(fallbackLng, text.ns)(text.key, text.text.trim())
                    if (existingFallback !== text.text.trim()) {
                        console.log("detected translation change: ", existingFallback, text.text.trim())
                        onFallbackLanguageValueChange(fallbackLng, text.ns, text.key, text.text.trim())
                    }

                    const details = i18n.getFixedT(lng, text.ns)(text.key, {returnDetails: true})
                    console.log(">>>>>>>.... details", text, details.res.length, details)
                    const translationExists = details.usedLng === lng && details.res && details.res.length > 0;
                    if (translationExists) {
                        return details.res;
                    } else if (text.excludeFromTranslation && existingFallback.length > 0) {
                        return existingFallback;
                    }

                    return I18nStore.decorateUntranslated(lng, text, existingFallback);
                } else {
                    return `${lng}.{${text.ns}:${text.key}}`
                }
            }
        }

    }

    private static decorateUntranslated(lng: string, text: NdTranslatedText, existingFallback: string) {
        return `<small style="font-size: 12px">n/a ${lng}:${text.ns}:${text.key}</small>[${existingFallback}]`;
    }

}


