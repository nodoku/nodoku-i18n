import LanguageDefImpl from "./i18n/language-def-impl";
import {I18nextProvider, NdTranslatedText} from "nodoku-core";
import {I18nStore} from "./i18n/i18n-store";
import {
    OnFallbackLngTextUpdateStrategyImpl,
    SimplelocalizeBackendApiClient
} from "./i18n/simplelocalize/simplelocalize-backend-api-client";


export namespace NodokuI18n {

    export type LanguageDef = LanguageDefImpl;


    export namespace Simplelocalize {

        export type OnFallbackLngTextUpdateStrategy = OnFallbackLngTextUpdateStrategyImpl;
        export const OnFallbackLngTextUpdateStrategy = OnFallbackLngTextUpdateStrategyImpl;

        export async function initI18nStore(nampespaces: readonly string[],
                                            fallbackLng: string,
                                            onFallbackLngTextUpdateStrategy: OnFallbackLngTextUpdateStrategy
                                                = OnFallbackLngTextUpdateStrategyImpl.reset_reviewed_status): Promise<void> {

            const allLlngs = (await SimplelocalizeBackendApiClient.allLanguagesImpl()).map(l => l.key);

            await I18nStore.initStore(allLlngs, nampespaces, fallbackLng,
                onFallbackLngTextUpdateStrategy,
                SimplelocalizeBackendApiClient.resourceLoader,
                SimplelocalizeBackendApiClient.missingKeyHandler)


        }


        export const allLanguages = async (): Promise<LanguageDef[]> => {
            return await SimplelocalizeBackendApiClient.allLanguagesImpl();
        }

        export const i18nForNodoku: I18nextProvider = async (lng: string): Promise<{t: (text: NdTranslatedText) => string}> => {
            return I18nStore.i18nForNodokuImpl(lng, SimplelocalizeBackendApiClient.onFallbackLanguageValueChange);
        }

    }

}