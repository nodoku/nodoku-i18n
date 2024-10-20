import LanguageDefImpl from "./i18n/language-def-impl";
import { I18nextProvider } from "nodoku-core";
import { OnFallbackLngTextUpdateStrategyImpl } from "./i18n/simplelocalize/simplelocalize-backend-api-client";
export declare namespace NodokuI18n {
    type LanguageDef = LanguageDefImpl;
    namespace Simplelocalize {
        type OnFallbackLngTextUpdateStrategy = OnFallbackLngTextUpdateStrategyImpl;
        const OnFallbackLngTextUpdateStrategy: typeof OnFallbackLngTextUpdateStrategyImpl;
        function initI18nStore(nampespaces: readonly string[], fallbackLng: string, onFallbackLngTextUpdateStrategy?: OnFallbackLngTextUpdateStrategy): Promise<void>;
        const allLanguages: () => Promise<LanguageDef[]>;
        const i18nForNodoku: I18nextProvider;
    }
}
