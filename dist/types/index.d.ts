import LanguageDefImpl from "./i18n/language-def-impl";
import { NdTranslatedText } from "nodoku-core";
import { OnFallbackLngTextUpdateStrategyImpl } from "./i18n/simplelocalize/simplelocalize-backend-api-client";
export declare namespace NodokuI18n {
    type LanguageDef = LanguageDefImpl;
    namespace Simplelocalize {
        type OnFallbackLngTextUpdateStrategy = OnFallbackLngTextUpdateStrategyImpl;
        const OnfallbackLngTextUpdateStrategy: typeof OnFallbackLngTextUpdateStrategyImpl;
        function initI18nStore(lng: string, nampespaces: readonly string[], fallbackLng: string, onFallbackLngTextUpdateStrategy?: OnFallbackLngTextUpdateStrategy): Promise<void>;
        function allLanguages(): Promise<LanguageDef[]>;
        function i18nForNodoku(lng: string): Promise<{
            t: (text: NdTranslatedText) => string;
        }>;
    }
}
