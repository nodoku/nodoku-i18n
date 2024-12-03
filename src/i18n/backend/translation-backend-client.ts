import {Resource} from "i18next";
import {LanguageDefImpl} from "../util/language-def-impl";
import {UpdatedKey, UpdatingValue} from "../util/dictionary";

export abstract class TranslationBackendClient {

    abstract allLanguages(): Promise<LanguageDefImpl[]>;

    abstract pushKeys(reqs: UpdatedKey[]): Promise<void>;

    abstract updateTranslations(reqs: UpdatingValue[]): Promise<void>;

    abstract deleteKeys(reqs: UpdatedKey[]): Promise<void>;

    abstract removeReviewedStatus(reqs: UpdatingValue[]): Promise<void>;

    abstract translationToResource(allLng: readonly string[], allNs: readonly string[]): Promise<Resource>;

}