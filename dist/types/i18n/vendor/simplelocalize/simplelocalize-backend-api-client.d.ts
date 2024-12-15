import { Resource } from "i18next";
import { LanguageDefImpl } from "../../util/language-def-impl.js";
import { UpdatedKey, UpdatingValue } from "../../util/dictionary.js";
import { TranslationBackendClient } from "../../backend/translation-backend-client.js";
export declare class SimplelocalizeBackendApiClientImpl extends TranslationBackendClient {
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
    static loadTranslationsUsingCdn(client: SimplelocalizeBackendApiClientImpl, allLng: readonly string[], allNs: readonly string[]): Promise<Resource>;
    static loadTranslationsUsingApi(client: SimplelocalizeBackendApiClientImpl, allLng: readonly string[], allNs: readonly string[]): Promise<Resource>;
    pushKeys(reqs: UpdatedKey[]): Promise<void>;
    updateTranslations(reqs: UpdatingValue[]): Promise<void>;
    removeReviewedStatus(reqs: UpdatingValue[]): Promise<void>;
    deleteKeys(reqs: UpdatedKey[]): Promise<void>;
}
