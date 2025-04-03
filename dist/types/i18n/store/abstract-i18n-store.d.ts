import { NdTranslatableText } from "nodoku-core";
import { LanguageDefImpl } from "../util/language-def-impl";
export declare abstract class AbstractI18nStore {
    abstract reloadResources(): Promise<void>;
    abstract allLanguages(): Promise<LanguageDefImpl[]>;
    abstract translateTranslatableText(lng: string, text: NdTranslatableText): string;
}
