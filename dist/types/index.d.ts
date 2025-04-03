import { LanguageDefImpl } from "./i18n/util/language-def-impl.js";
import { NdI18nextProvider } from "nodoku-core";
import { MissingKeyStorageImpl, OnMissingKeyStrategyImpl, OnFallbackLngTextUpdateStrategyImpl } from "./i18n/backend/missing-key-storage.js";
import { AbstractI18nStore } from "./i18n/store/abstract-i18n-store.js";
import { TranslationBackendClient } from "./i18n/backend/translation-backend-client.js";
export declare const delay: (ms: number) => Promise<unknown>;
export declare namespace NodokuI18n {
    type LanguageDef = LanguageDefImpl;
    abstract class I18nStore extends AbstractI18nStore {
    }
    abstract class MissingKeyStorage extends MissingKeyStorageImpl {
    }
    type OnFallbackLngTextUpdateStrategy = OnFallbackLngTextUpdateStrategyImpl;
    const OnFallbackLngTextUpdateStrategy: typeof OnFallbackLngTextUpdateStrategyImpl;
    type OnMissingKeyStrategy = OnMissingKeyStrategyImpl;
    const OnMissingKeyStrategy: typeof OnMissingKeyStrategyImpl;
    function initI18nStore(allLlngs: readonly string[] | "all", nampespaces: readonly string[], fallbackLng: string, translationFetchMode: "cdn" | "api", saveMissing: boolean, loadOnInit: boolean, client: TranslationBackendClient, missingKeyStorage: MissingKeyStorage): Promise<I18nStore>;
    function i18nForNodoku(store: AbstractI18nStore): NdI18nextProvider;
}
