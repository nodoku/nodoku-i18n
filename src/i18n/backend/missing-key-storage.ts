import {TranslationBackendClient} from "./translation-backend-client";

export abstract class MissingKeyStorage {

    abstract onFallbackLanguageValueChange(language: string, namespace: string, key: string, text: string): void;

    abstract onMissingKey(lngs: readonly string[],
                          ns: string,
                          key: string,
                          fallbackValue: string,
                          updateMissing: boolean,
                          options: any): void;


    abstract pushMissingKeys(client: TranslationBackendClient): Promise<void>;


}