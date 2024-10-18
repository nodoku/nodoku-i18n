import LanguageDefImpl from "./i18n/language-def-impl";
import {NdTranslatedText} from "nodoku-core";
import {I18nStore} from "./i18n/i18n-store";
import {
    OnFallbackLngTextUpdateStrategyImpl,
    SimplelocalizeBackendApiClient
} from "./i18n/simplelocalize/simplelocalize-backend-api-client";
import {i18n} from "i18next";



export namespace NodokuI18n {

    export type LanguageDef = LanguageDefImpl;


    export namespace Simplelocalize {

        export type OnFallbackLngTextUpdateStrategy = OnFallbackLngTextUpdateStrategyImpl;
        export const OnfallbackLngTextUpdateStrategy = OnFallbackLngTextUpdateStrategyImpl;

        export async function initI18nStore(lng: string,
                                            nampespaces: readonly string[],
                                            fallbackLng: string,
                                            onFallbackLngTextUpdateStrategy: OnFallbackLngTextUpdateStrategy = OnFallbackLngTextUpdateStrategyImpl.update_fallback_lng_only): Promise<void> {

            const allLlngs = await allLanguages();
            const all: i18n[] = [];
            for (const lng of allLlngs) {
                if (lng.key !== fallbackLng) {
                    const i18n: i18n = await I18nStore.initStore(lng.key, nampespaces, fallbackLng,
                            SimplelocalizeBackendApiClient.resourceLoader,
                            SimplelocalizeBackendApiClient.missingKeyHandler);

                    all.push(i18n);
                }
            }

            console.log("loaded i18n's :", all.map(i => {return {
                lng: i.language,
                loaded: i.hasLoadedNamespace(nampespaces)}}))

            SimplelocalizeBackendApiClient.onFallbackLngTextUpdateStrategy = onFallbackLngTextUpdateStrategy;
            setInterval(SimplelocalizeBackendApiClient.pushMissingKeys, 10000)

        }


        export async function allLanguages(): Promise<LanguageDef[]> {
            return SimplelocalizeBackendApiClient.allLanguagesImpl();
        }

        export async function i18nForNodoku(lng: string): Promise<{t: (text: NdTranslatedText) => string}> {
            return I18nStore.i18nForNodokuImpl(lng,
                SimplelocalizeBackendApiClient.onFallbackLanguageValueChange,
                SimplelocalizeBackendApiClient.onPushMissingTranslation);
        }

    }

}