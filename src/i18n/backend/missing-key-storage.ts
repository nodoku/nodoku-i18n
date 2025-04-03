import {TranslationBackendClient} from "./translation-backend-client";

/*
 * the strategy to undertake when there is a difference between the value provided in the content block, and the value
 * recorded as the value of the fallback language.
 *
 * That the fallback language is by definition the language in which the content is written. Hence, for a given translation key,
 * it is the value provided by the content, takes precedence.
 *
 * For the translation key, the translation corresponding to the fallback language should always be equal to the value
 * provided by the content for the same translation key.
 *
 * Consequently, it may so happen that this equivalence doesn't hold anymore, when the content changes for a given
 * translation key (markdown file content modified, for example).
 *
 * If such situation is detected, we should update the value of translation for the fallback language for the
 * translation key concerned.
 *
 * When the translation value is updated, the corresponding translation on other languages may not correspond anymore
 * to this new value.
 *
 * And in this case several strategies are possible:
 *
 * - update_fallback_lng_only:
 *      update the value of the translation for fallback language, and stop there, don't do anything else
 *
 * - delete_translations:
 *      * update the value of the translation for fallback language
 *      * delete translations (if present) for other languages, thus indicating that the new translations should be provided
 *
 * - reset_reviewed_status:
 *      * update the value of the translation for fallback language
 *      * remove the REVIEWED flag from the translations for other languages
 *
 * Which strategy to use is up to the user of the library to choose.
 * By default, strategy 'reset_reviewed_status' is used
 */
export enum OnFallbackLngTextUpdateStrategyImpl {

    update_fallback_lng_only,
    delete_translations,
    reset_reviewed_status
}

export enum OnMissingKeyStrategyImpl {
    upload, save_to_file
}



export abstract class MissingKeyStorageImpl {

    abstract onFallbackLanguageValueChange(language: string, namespace: string, key: string, text: string): void;

    abstract onMissingKey(lngs: readonly string[],
                          ns: string,
                          key: string,
                          fallbackValue: string,
                          updateMissing: boolean,
                          options: any): void;

    abstract onExistingKey(ns: string, key: string): void;

    abstract pushMissingKeys(client: TranslationBackendClient): Promise<void>;

}