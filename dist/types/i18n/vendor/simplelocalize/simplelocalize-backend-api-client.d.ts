import { Resource } from "i18next";
import { LanguageDefImpl } from "../../util/language-def-impl.js";
import { UpdatedKey, UpdatingValue } from "../../util/dictionary.js";
import { TranslationBackendClient } from "../../backend/translation-backend-client.js";
import { TranslationKey } from "../../util/dictionary.js";
export declare class SimplelocalizeBackendApiClientImpl extends TranslationBackendClient {
    private static cdnBaseUrl;
    private static endpointUpdateKeys;
    private static endpointUploadKeys;
    private static endpointTranslationKey;
    private apiKey;
    private projectToken;
    private cdnLoadPathBase;
    private translationFetchMode;
    constructor(apiKey: string, projectToken: string, translationFetchMode: "cdn" | "api");
    allLanguages(): Promise<LanguageDefImpl[]>;
    translationToResource(allLng: readonly string[], allNs: readonly string[], fallbackLng: string): Promise</*AllLanguagesAllNamespacesTranslationResource*/ Resource>;
    static loadTranslationsUsingCdn(client: SimplelocalizeBackendApiClientImpl, allLng: readonly string[], allNs: readonly string[]): Promise<Resource>;
    private static mergeWithReply;
    static loadTranslationsUsingApi(client: SimplelocalizeBackendApiClientImpl, allLng: readonly string[], allNs: readonly string[]): Promise<Resource>;
    pushKeys(reqs: UpdatedKey[]): Promise<void>;
    updateTranslations(reqs: UpdatingValue[]): Promise<void>;
    removeReviewedStatus(reqs: UpdatingValue[]): Promise<void>;
    deleteKeys(reqs: TranslationKey[]): Promise<void>;
    getAllTranslationKeys(): Promise<TranslationKey[]>;
}
