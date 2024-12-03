import { Resource } from "i18next";
import { LanguageDefImpl } from "../../util/language-def-impl.js";
import { UpdatedKey, UpdatingValue } from "../../util/dictionary.js";
import { TranslationBackendClient } from "../../backend/translation-backend-client.js";
export declare enum OnFallbackLngTextUpdateStrategyImpl {
    update_fallback_lng_only = 0,
    delete_translations = 1,
    reset_reviewed_status = 2
}
export declare enum OnMissingKeyStrategyImpl {
    upload = 0,
    save_to_file = 1
}
export declare class SimplelocalizeBackendApiClient extends TranslationBackendClient {
    private static cdnBaseUrl;
    private static endpointUpdateKeys;
    private static endpointUploadKeys;
    private apiKey;
    private projectToken;
    private cdnLoadPathBase;
    private translationFetchMode;
    constructor(apiKey: string, projectToken: string, translationFetchMode: "cdn" | "api");
    allLanguages(): Promise<LanguageDefImpl[]>;
    translationToResource(allLng: readonly string[], allNs: readonly string[]): Promise</*AllLanguagesAllNamespacesTranslationResource*/ Resource>;
    static loadTranslationsUsingCdn(client: SimplelocalizeBackendApiClient, allLng: readonly string[], allNs: readonly string[]): Promise<Resource>;
    static loadTranslationsUsingApi(client: SimplelocalizeBackendApiClient, allLng: readonly string[], allNs: readonly string[]): Promise<Resource>;
    pushKeys(reqs: UpdatedKey[]): Promise<void>;
    updateTranslations(reqs: UpdatingValue[]): Promise<void>;
    removeReviewedStatus(reqs: UpdatingValue[]): Promise<void>;
    deleteKeys(reqs: UpdatedKey[]): Promise<void>;
}
