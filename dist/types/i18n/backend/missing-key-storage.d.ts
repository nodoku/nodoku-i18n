import { TranslationBackendClient } from "./translation-backend-client";
export declare enum OnFallbackLngTextUpdateStrategyImpl {
    update_fallback_lng_only = 0,
    delete_translations = 1,
    reset_reviewed_status = 2
}
export declare enum OnMissingKeyStrategyImpl {
    upload = 0,
    save_to_file = 1
}
export declare abstract class MissingKeyStorageImpl {
    abstract onFallbackLanguageValueChange(language: string, namespace: string, key: string, text: string): void;
    abstract onMissingKey(lngs: readonly string[], ns: string, key: string, fallbackValue: string, updateMissing: boolean, options: any): void;
    abstract pushMissingKeys(client: TranslationBackendClient): Promise<void>;
}
