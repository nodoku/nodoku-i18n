import LanguageDefImpl from "./i18n/language-def-impl";
import { NdTranslatedText } from "nodoku-core";
export type LanguageDef = LanguageDefImpl;
export declare namespace NodokuI18nSimplelocalize {
    function loadAllLangsAndNamespaces(lng: string, nampespaces: string[], fallbackLng: string): Promise<void>;
    function allLanguages(): Promise<LanguageDef[]>;
    function i18nForNodoku(lng: string): Promise<{
        t: (text: NdTranslatedText) => string;
    }>;
}
