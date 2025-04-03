import { Dictionary, UpdatedKey } from "../../util/dictionary.js";
import { MissingKeyStorageImpl, OnFallbackLngTextUpdateStrategyImpl, OnMissingKeyStrategyImpl } from "../../backend/missing-key-storage.js";
import { TranslationBackendClient } from "../../backend/translation-backend-client.js";
import { TranslationKey } from "../../util/dictionary.js";
export declare class SimplelocalizeMissingKeyStorage extends MissingKeyStorageImpl {
    private existingKeysRequests;
    private missingKeysRequests;
    private fallbackLanguageValuesToBeUpdated;
    private client;
    private onFallbackLngTextUpdateStrategy;
    private onMissingKeyStrategy;
    private onMissingKeyReload;
    constructor(client: TranslationBackendClient, onMissingKeyReload: () => Promise<void>, onMissingKeyStrategy: OnMissingKeyStrategyImpl, onFallbackLngTextUpdateStrategy: OnFallbackLngTextUpdateStrategyImpl);
    onMissingKey(lngs: readonly string[], ns: string, key: string, fallbackValue: string, updateMissing: boolean, options: any): void;
    onExistingKey(ns: string, key: string): void;
    onFallbackLanguageValueChange(language: string, namespace: string, key: string, text: string): void;
    private toBase64;
    pushMissingKeys(client: TranslationBackendClient): Promise<void>;
    static pushMissingKeysForClient(client: TranslationBackendClient, missingKeysRequests: Dictionary<UpdatedKey, string>): Promise<void>;
    static removeUnusedKeysForClient(client: TranslationBackendClient, existingKeysRequests: Dictionary<TranslationKey, string>): Promise<void>;
    static pushUpdatedKeysForClient(client: TranslationBackendClient, fallbackLanguageValuesToBeUpdated: Dictionary<UpdatedKey, string>, onFallbackLngTextUpdateStrategy: OnFallbackLngTextUpdateStrategyImpl): Promise<void>;
    private static flatReqsChunked;
}
