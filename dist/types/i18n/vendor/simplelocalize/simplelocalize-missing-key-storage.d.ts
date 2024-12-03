import { Dictionary, UpdatedKey } from "../../util/dictionary.js";
import { MissingKeyStorage } from "../../backend/missing-key-storage.js";
import { TranslationBackendClient } from "../../backend/translation-backend-client.js";
import { AbstractI18nStore } from "../../store/abstract-i18n-store";
import { NodokuI18n } from "../../../index.js";
import OnFallbackLngTextUpdateStrategy = NodokuI18n.Simplelocalize.OnFallbackLngTextUpdateStrategy;
import OnMissingKeyStrategy = NodokuI18n.Simplelocalize.OnMissingKeyStrategy;
export declare class SimplelocalizeMissingKeyStorage extends MissingKeyStorage {
    private missingKeysRequests;
    private fallbackLanguageValuesToBeUpdated;
    private i18nStore;
    private onFallbackLngTextUpdateStrategy;
    private onMissingKeyStrategy;
    constructor(i18nStore: AbstractI18nStore, onMissingKeyStrategy: OnMissingKeyStrategy, onFallbackLngTextUpdateStrategy: OnFallbackLngTextUpdateStrategy);
    onMissingKey(lngs: readonly string[], ns: string, key: string, fallbackValue: string, updateMissing: boolean, options: any): void;
    private dumpToFile;
    onFallbackLanguageValueChange(language: string, namespace: string, key: string, text: string): void;
    pushMissingKeys(client: TranslationBackendClient): Promise<void>;
    static pushMissingKeysForClient(client: TranslationBackendClient, missingKeysRequests: Dictionary<UpdatedKey, string>, fallbackLanguageValuesToBeUpdated: Dictionary<UpdatedKey, string>, onFallbackLngTextUpdateStrategy: OnFallbackLngTextUpdateStrategy): Promise<void>;
    private static flatReqsChunked;
}
