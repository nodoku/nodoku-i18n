import { i18n } from "i18next";
import { NdTranslatableText } from "nodoku-core";
import { OnFallbackLngTextUpdateStrategyImpl } from "./simplelocalize/simplelocalize-backend-api-client";
export declare const delay: (ms: number) => Promise<unknown>;
export type LanguageNsTranslationResource = {
    [key: string]: string;
};
export type LanguageTranslationResource = {
    [key: string]: {
        [key: string]: LanguageNsTranslationResource;
    };
};
export type AllLanguagesAllNamespacesTranslationResource = {
    [key: string]: {
        [key: string]: LanguageTranslationResource;
    };
};
export type UpdatedKey = {
    language: string;
    namespace: string;
    key: string;
};
export type MissingKeyHandler = (lngs: readonly string[], ns: string, key: string, fallbackValue: string, updateMissing: boolean, options: any) => void;
export type FallbackLanguageValueChangeHandler = (language: string, namespace: string, key: string, text: string) => void;
export type TranslationResourceLoader = (allLng: readonly string[], allNs: readonly string[]) => Promise<AllLanguagesAllNamespacesTranslationResource>;
export declare class I18nStore {
    private static sharedI18n;
    private static isInitStarted;
    static initStore(allLngs: readonly string[], nampespaces: readonly string[], fallbackLng: string, saveMissing: boolean, onFallbackLngTextUpdateStrategy: OnFallbackLngTextUpdateStrategyImpl, resourceLoader: TranslationResourceLoader, missingKeyHandler: MissingKeyHandler): Promise<void>;
    private static createAndInitI18next;
    static reloadResources(i18n?: i18n | undefined): Promise<void>;
    private static createOptions;
    static translate(lng: string, ns: string, key: string): string;
    private static translateTranslatableText;
    static i18nForNodokuImpl(lng: string, fallbackLanguageValueChangeHandler: FallbackLanguageValueChangeHandler): Promise<{
        t: (text: NdTranslatableText) => string;
    }>;
    private static wrapInBraces;
    private static unwrapFromBraces;
    private static decorateUntranslated;
}
