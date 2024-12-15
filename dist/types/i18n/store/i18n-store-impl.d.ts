import { NdTranslatableText } from "nodoku-core";
import { AbstractI18nStore } from "./abstract-i18n-store";
import { TranslationBackendClient } from "../backend/translation-backend-client";
import { MissingKeyStorageImpl } from "../backend/missing-key-storage";
import { LanguageDefImpl } from "../util/language-def-impl";
export declare class I18nStoreImpl extends AbstractI18nStore {
    private sharedI18n;
    private isInitStarted;
    private client?;
    private missingKeyStorage?;
    private ref;
    private constructor();
    getRef(): number;
    static createStore(): I18nStoreImpl;
    initStore(allLngs: readonly string[], nampespaces: readonly string[], fallbackLng: string, saveMissing: boolean, loadOnInit: boolean, client: TranslationBackendClient, missingKeyStorage: MissingKeyStorageImpl): Promise<void>;
    allLanguages(): Promise<LanguageDefImpl[]>;
    private createAndInitI18next;
    reloadResources(): Promise<void>;
    private static reloadResourcesForI18n;
    private createOptions;
    translate(lng: string, ns: string, key: string): string;
    translateTranslatableText(lng: string, text: NdTranslatableText): string;
    private static wrapInBraces;
    private static unwrapFromBraces;
    private static decorateUntranslated;
}
