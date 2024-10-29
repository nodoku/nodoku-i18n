import LanguageDefImpl from "../language-def-impl";
import { MissingKeyHandler, TranslationResourceLoader } from "../i18n-store";
export declare const projectToken: string | undefined;
export declare const cdnBaseUrl = "https://cdn.simplelocalize.io";
export declare const environment = "_latest";
export declare const apiKey: string;
export declare const loadPathBase: string;
export declare enum OnFallbackLngTextUpdateStrategyImpl {
    update_fallback_lng_only = 0,
    delete_translations = 1,
    reset_reviewed_status = 2
}
export declare class SimplelocalizeBackendApiClient {
    static endpointUpdateKeys: string;
    static endpointUploadKeys: string;
    private static missingKeysRequests;
    private static fallbackLanguageValuesToBeUpdated;
    static onFallbackLngTextUpdateStrategy: OnFallbackLngTextUpdateStrategyImpl;
    static allLanguagesImpl(): Promise<LanguageDefImpl[]>;
    static missingKeyHandler: MissingKeyHandler;
    static onFallbackLanguageValueChange(language: string, namespace: string, key: string, text: string): void;
    static resourceLoader: TranslationResourceLoader;
    private static loadTranslationsUsingCdn;
    private static loadTranslationsUsingApi;
    static pushMissingKeys(): Promise<void>;
    private static pushKeys;
    private static updateTranslations;
    private static removeReviewed;
    private static deleteKeys;
    private static flatReqsChunked;
}
