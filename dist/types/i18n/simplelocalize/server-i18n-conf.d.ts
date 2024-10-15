import { i18n } from 'i18next';
import LanguageDefImpl from "../language-def-impl";
import { NdTranslatedText } from "nodoku-core";
export declare const projectToken: string | undefined;
export declare const cdnBaseUrl = "https://cdn.simplelocalize.io";
export declare const environment = "_latest";
export declare const loadPathBase: string;
export declare const allLanguagesImpl: () => Promise<LanguageDefImpl[]>;
export declare function getI18nByLangByNs(): Map<string, Map<string, i18n>>;
export declare function loadAllLangsAndNamespacesImpl(lng: string, nampespaces: string[], fallbackLng: string): Promise<void>;
export declare function i18nForNodokuImpl(lng: string): Promise<{
    t: (text: NdTranslatedText) => string;
}>;
