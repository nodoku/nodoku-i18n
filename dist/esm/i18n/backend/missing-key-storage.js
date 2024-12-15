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
export var OnFallbackLngTextUpdateStrategyImpl;
(function (OnFallbackLngTextUpdateStrategyImpl) {
    OnFallbackLngTextUpdateStrategyImpl[OnFallbackLngTextUpdateStrategyImpl["update_fallback_lng_only"] = 0] = "update_fallback_lng_only";
    OnFallbackLngTextUpdateStrategyImpl[OnFallbackLngTextUpdateStrategyImpl["delete_translations"] = 1] = "delete_translations";
    OnFallbackLngTextUpdateStrategyImpl[OnFallbackLngTextUpdateStrategyImpl["reset_reviewed_status"] = 2] = "reset_reviewed_status";
})(OnFallbackLngTextUpdateStrategyImpl || (OnFallbackLngTextUpdateStrategyImpl = {}));
export var OnMissingKeyStrategyImpl;
(function (OnMissingKeyStrategyImpl) {
    OnMissingKeyStrategyImpl[OnMissingKeyStrategyImpl["upload"] = 0] = "upload";
    OnMissingKeyStrategyImpl[OnMissingKeyStrategyImpl["save_to_file"] = 1] = "save_to_file";
})(OnMissingKeyStrategyImpl || (OnMissingKeyStrategyImpl = {}));
export class MissingKeyStorageImpl {
}
