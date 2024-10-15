import LanguageDefImpl from "./i18n/language-def-impl";
import {allLanguagesImpl, i18nForNodokuImpl, loadAllLangsAndNamespacesImpl} from "./i18n/simplelocalize/server-i18n-conf";
import {NdTranslatedText} from "nodoku-core";


export type LanguageDef = LanguageDefImpl;

export namespace NodokuI18nSimplelocalize {

    export async function loadAllLangsAndNamespaces(lng: string, nampespaces: string[], fallbackLng: string): Promise<void> {
        await loadAllLangsAndNamespacesImpl(lng, nampespaces, fallbackLng);
    }

    export async function allLanguages(): Promise<LanguageDef[]> {
        return allLanguagesImpl();
    }

    export async function i18nForNodoku(lng: string): Promise<{t: (text: NdTranslatedText) => string}> {
        return i18nForNodokuImpl(lng);
    }

}