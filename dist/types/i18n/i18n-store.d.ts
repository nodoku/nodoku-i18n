import { i18n } from "i18next";
import { NdTranslatedText } from "nodoku-core";
import { OnFallbackLngTextUpdateStrategyImpl } from "./simplelocalize/simplelocalize-backend-api-client";
export type LanguageNsTranslationResource = {
    [key: string]: string;
};
export type LanguageTranslationResource = {
    [key: string]: {
        [key: string]: LanguageNsTranslationResource;
    };
};
export type UpdatedKey = {
    language: string;
    namespace: string;
    key: string;
};
export type MissingKeyHandler = (lngs: readonly string[], ns: string, key: string, fallbackValue: string, updateMissing: boolean, options: any) => void;
export type FallbackLanguageValueChangeHandler = (language: string, namespace: string, key: string, text: string) => void;
export type TranslationResourceLoader = (lng: string, ns: string) => Promise<LanguageNsTranslationResource>;
export declare class I18nStore {
    private static i18nByLang;
    static getI18nByLangByNs(lng: string): i18n | undefined;
    static getAllI18n(): i18n[];
    static initStore(allLlngs: readonly string[], nampespaces: readonly string[], fallbackLng: string, onFallbackLngTextUpdateStrategy: OnFallbackLngTextUpdateStrategyImpl, resourceLoader: TranslationResourceLoader, missingKeyHandler: MissingKeyHandler): Promise<void>;
    private static initStoreForLng;
    private static createAndInitI18next;
    static reloadResources(): Promise<void>;
    private static loadTranslations;
    private static createOptions;
    static translate(lng: string, ns: string, key: string): string;
    private static translateNdTranslatedText;
    static i18nForNodokuImpl(lng: string, fallbackLanguageValueChangeHandler: FallbackLanguageValueChangeHandler): Promise<{
        t: (text: NdTranslatedText) => string;
    }>;
    private static wrapInBraces;
    private static unwrapFromBraces;
    private static decorateUntranslated;
}
