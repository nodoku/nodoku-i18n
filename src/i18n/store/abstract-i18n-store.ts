import {NdTranslatableText} from "nodoku-core";
import {LanguageDefImpl} from "../util/language-def-impl";


export abstract class AbstractI18nStore {

    abstract translate(lng: string, ns: string, key: string): string;

    abstract reloadResources(): Promise<void>;

    abstract allLanguages(): Promise<LanguageDefImpl[]>;

    abstract translateTranslatableText(lng: string, text: NdTranslatableText): string;

    abstract getRef(): number;
}
