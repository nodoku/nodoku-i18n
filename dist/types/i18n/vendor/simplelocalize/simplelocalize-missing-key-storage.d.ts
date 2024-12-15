import { Dictionary, UpdatedKey } from "../../util/dictionary.js";
import { MissingKeyStorageImpl, OnFallbackLngTextUpdateStrategyImpl, OnMissingKeyStrategyImpl } from "../../backend/missing-key-storage";
import { TranslationBackendClient } from "../../backend/translation-backend-client.js";
export declare class SimplelocalizeMissingKeyStorage extends MissingKeyStorageImpl {
    private missingKeysRequests;
    private fallbackLanguageValuesToBeUpdated;
    private client;
    private onFallbackLngTextUpdateStrategy;
    private onMissingKeyStrategy;
    private onMissingKeyReload;
    constructor(client: TranslationBackendClient, onMissingKeyReload: () => Promise<void>, onMissingKeyStrategy: OnMissingKeyStrategyImpl, onFallbackLngTextUpdateStrategy: OnFallbackLngTextUpdateStrategyImpl);
    onMissingKey(lngs: readonly string[], ns: string, key: string, fallbackValue: string, updateMissing: boolean, options: any): void;
    private dumpToFile;
    onFallbackLanguageValueChange(language: string, namespace: string, key: string, text: string): void;
    pushMissingKeys(client: TranslationBackendClient): Promise<void>;
    static pushMissingKeysForClient(client: TranslationBackendClient, missingKeysRequests: Dictionary<UpdatedKey, string>, fallbackLanguageValuesToBeUpdated: Dictionary<UpdatedKey, string>, onFallbackLngTextUpdateStrategy: OnFallbackLngTextUpdateStrategyImpl): Promise<void>;
    private static flatReqsChunked;
}
