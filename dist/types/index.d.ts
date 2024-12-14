import { LanguageDefImpl } from "./i18n/util/language-def-impl";
import { NdI18nextProvider } from "nodoku-core";
import { OnFallbackLngTextUpdateStrategyImpl } from "./i18n/vendor/simplelocalize/simplelocalize-backend-api-client";
import { OnMissingKeyStrategyImpl } from "./i18n/vendor/simplelocalize/simplelocalize-backend-api-client";
import { AbstractI18nStore } from "./i18n/store/abstract-i18n-store";
export declare namespace NodokuI18n {
    type LanguageDef = LanguageDefImpl;
    abstract class I18nStore extends AbstractI18nStore {
    }
    namespace Simplelocalize {
        type OnFallbackLngTextUpdateStrategy = OnFallbackLngTextUpdateStrategyImpl;
        const OnFallbackLngTextUpdateStrategy: typeof OnFallbackLngTextUpdateStrategyImpl;
        type OnMissingKeyStrategy = OnMissingKeyStrategyImpl;
        const OnMissingKeyStrategy: typeof OnMissingKeyStrategyImpl;
        function initI18nStore(apiKey: string, projectToken: string, allLlngs: readonly string[] | "all", nampespaces: readonly string[], fallbackLng: string, translationFetchMode: "cdn" | "api", saveMissing: boolean, loadOnInit: boolean, onMissingKeyStrategy: OnMissingKeyStrategy, onFallbackLngTextUpdateStrategy: OnFallbackLngTextUpdateStrategy): Promise<I18nStore>;
        function i18nForNodoku(store: AbstractI18nStore): NdI18nextProvider;
    }
}
