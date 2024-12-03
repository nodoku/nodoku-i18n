import {LanguageDefImpl} from "./i18n/util/language-def-impl";
import {I18nextProvider, NdTranslatableText} from "nodoku-core";
import {I18nStoreImpl} from "./i18n/store/i18n-store-impl";
import {
    OnFallbackLngTextUpdateStrategyImpl,
    SimplelocalizeBackendApiClient
} from "./i18n/vendor/simplelocalize/simplelocalize-backend-api-client";
import {OnMissingKeyStrategyImpl} from "./i18n/vendor/simplelocalize/simplelocalize-backend-api-client";
import {AbstractI18nStore} from "./i18n/store/abstract-i18n-store";
import {MissingKeyStorage} from "./i18n/backend/missing-key-storage";
import {SimplelocalizeMissingKeyStorage} from "./i18n/vendor/simplelocalize/simplelocalize-missing-key-storage";

export namespace NodokuI18n {

    export type LanguageDef = LanguageDefImpl;

    export abstract class I18nStore extends AbstractI18nStore {}

    export namespace Simplelocalize {

        export type OnFallbackLngTextUpdateStrategy = OnFallbackLngTextUpdateStrategyImpl;
        export const OnFallbackLngTextUpdateStrategy = OnFallbackLngTextUpdateStrategyImpl;

        export type OnMissingKeyStrategy = OnMissingKeyStrategyImpl;
        export const OnMissingKeyStrategy = OnMissingKeyStrategyImpl;


        export async function initI18nStore(apiKey: string,
                                            projectToken: string,
                                            allLlngs: readonly string[] | "all",
                                            nampespaces: readonly string[],
                                            fallbackLng: string,
                                            translationFetchMode: "cdn" | "api",
                                            saveMissing: boolean,
                                            loadImmediately: boolean,
                                            onMissingKeyStrategy: OnMissingKeyStrategy,
                                            onFallbackLngTextUpdateStrategy: OnFallbackLngTextUpdateStrategy): Promise<I18nStore> {

            const i18nStore: I18nStoreImpl = I18nStoreImpl.createStore();

            const client: SimplelocalizeBackendApiClient =
                new SimplelocalizeBackendApiClient(apiKey, projectToken, translationFetchMode);

            const missingKeyStorage: MissingKeyStorage =
                new SimplelocalizeMissingKeyStorage(i18nStore, onMissingKeyStrategy, onFallbackLngTextUpdateStrategy);

            console.log("initialized client...")

            console.log("in initI18nStore allLlngs, saveMissing, devMode", allLlngs, saveMissing, translationFetchMode)


            const lngs: readonly string[] = allLlngs === "all" ? (await client.allLanguages()).map(ld => ld.key) : allLlngs;


            await i18nStore.initStore(lngs, nampespaces, fallbackLng, saveMissing, loadImmediately, client, missingKeyStorage);

            if (saveMissing && onMissingKeyStrategy === OnMissingKeyStrategyImpl.upload) {
                setInterval(() => missingKeyStorage.pushMissingKeys(client!), 10000)
            }

            return i18nStore;

        }


        export function i18nForNodoku(store: AbstractI18nStore): I18nextProvider {
            return async (lng: string): Promise<{t: (text: NdTranslatableText) => string}> => {
                return {t: (text: NdTranslatableText) => store.translateTranslatableText(lng, text)};
            }
        }

    }

}