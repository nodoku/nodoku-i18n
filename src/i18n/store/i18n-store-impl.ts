import {createInstance, i18n, InitOptions} from "i18next";
import {NdTranslatableText} from "nodoku-core";
import {AbstractI18nStore} from "./abstract-i18n-store.js";
import {TranslationBackendClient} from "../backend/translation-backend-client.js";
import {MissingKeyStorageImpl} from "../backend/missing-key-storage.js";
import {LanguageDefImpl} from "../util/language-def-impl.js";
import {delay} from "../../index.js";


export class I18nStoreImpl extends AbstractI18nStore {

    private sharedI18n: i18n | undefined = undefined;
    private isInitStarted: boolean = false;
    private client?: TranslationBackendClient;
    private missingKeyStorage?: MissingKeyStorageImpl;

    private ref;

    private constructor() {
        super();
        this.ref = Math.random();
    }

    public static createStore(): I18nStoreImpl {

        return new I18nStoreImpl();
    }

    public async initStore(allLngs: readonly string[],
                           nampespaces: readonly string[],
                           fallbackLng: string,
                           saveMissing: boolean,
                           loadOnInit: boolean,
                           client: TranslationBackendClient,
                           missingKeyStorage: MissingKeyStorageImpl): Promise<void> {

        console.log("this.sharedI18n defined", this.sharedI18n !== undefined)

        if (this.sharedI18n !== undefined) {

            if (loadOnInit) {
                console.log("this.sharedI18n is already defined, refetching resources...")
                await I18nStoreImpl.reloadResourcesForI18n(this.sharedI18n);
            }
            return ;
        }

        if (this.isInitStarted) {
            let k = 200;
            while (k-- >= 0 && this.sharedI18n == undefined) {
                await delay(1000);
            }
            if (this.sharedI18n == undefined) {
                throw new Error("has been waiting for initialization, but failed...");
            }
            return;
        }

        this.isInitStarted = true;

        console.log("creating and initializing i18next instance...", allLngs)
        const instanceInCreation: i18n =  await this.createAndInitI18next(allLngs, nampespaces, fallbackLng, saveMissing, client, missingKeyStorage/*resourceLoader, missingKeyHandler*/);

        if (!loadOnInit) {
            await I18nStoreImpl.reloadResourcesForI18n(instanceInCreation);
        }

        this.sharedI18n = instanceInCreation;
        this.isInitStarted = false;
        this.missingKeyStorage = missingKeyStorage;

        // console.log("this.sharedI18n defined", this.sharedI18n !== undefined, this.ref)

    }

    override allLanguages(): Promise<LanguageDefImpl[]> {
        if (!this.client) {
            throw new Error("client is not initialized, call createAndInitI18next first")
        }
        return this.client.allLanguages();
    }

    private async createAndInitI18next(allLngs: readonly string[],
                                       namespaces: readonly string[],
                                       fallbackLng: string,
                                       saveMissing: boolean,
                                       client: TranslationBackendClient,
                                       missingKeyStorage: MissingKeyStorageImpl): Promise<i18n> {

        this.client = client;
        const i18nInstance: i18n = createInstance()
        const options = this.createOptions(allLngs, namespaces, fallbackLng, saveMissing, client, missingKeyStorage);
        options.resources = await client.translationToResource(options.supportedLngs as readonly string[], namespaces, fallbackLng);
        console.log("about to initialize instance i18next with options.resources", options.resources ? Object.keys(options.resources).length : "undef")
        await i18nInstance.init(options)
        return i18nInstance;
    }


    public override async reloadResources(): Promise<void> {
        if (!this.sharedI18n) {
            console.log("WARNING: I18nStore is not initialized yet, call I18nStore.initStore first...")
            return;
        }
        await I18nStoreImpl.reloadResourcesForI18n(this.sharedI18n);
    }

    private static async reloadResourcesForI18n(i18nInstance: i18n): Promise<void> {

        if (i18nInstance) {

            const options = i18nInstance.options;
            const namespaces = Array.isArray(options.ns) ? options.ns || [] : [options.ns];
            const fallbackLng: string = Array.isArray(options.fallbackLng) ? options.fallbackLng[0] : options.fallbackLng;
            const client = (options as {client: TranslationBackendClient}).client;

            options.resources = await client.translationToResource(options.supportedLngs as readonly string[], namespaces, fallbackLng);
            // await i18nInstance.init(options)

            console.log("reloaded translation resources for ", (options.supportedLngs as string[]).join(", "),
                "fallbackLng", fallbackLng)

        }

    }

    private createOptions(allLngs: readonly string[],
                          namespaces: readonly string[],
                          fallbackLng: string,
                          saveMissing: boolean,
                          client: TranslationBackendClient,
                          missingKeyStorage: MissingKeyStorageImpl): InitOptions & {client: TranslationBackendClient} {


        return {
            // debug: true,
            resources: {},
            fallbackLng: fallbackLng,
            supportedLngs: allLngs,
            lng: fallbackLng,
            ns: namespaces,
            saveMissing: saveMissing,
            preload: allLngs,
            updateMissing: saveMissing,
            // initImmediate: true,
            initAsync: false,
            keySeparator: false,
            missingKeyNoValueFallbackToKey: true,
            client: client,
            appendNamespaceToMissingKey: false,
            saveMissingTo: "fallback"/*"current"*/,
            ignoreJSONStructure: false,
            missingKeyHandler: (lngs: readonly string[],
                                ns: string,
                                key: string,
                                fallbackValue: string,
                                updateMissing: boolean,
                                options: any) => missingKeyStorage.onMissingKey(lngs, ns, key, fallbackValue, updateMissing, options)
        }
    }

    public override translateTranslatableText(lng: string, text: NdTranslatableText): string {

        // console.log("translating ", lng, text, I18nStore.sharedI18n ? "present" : "non-present")

        if (this.sharedI18n) {

            if (this.missingKeyStorage) {
                this.missingKeyStorage.onExistingKey(text.ns, text.key)
            }

            const fallbackLng: string = Array.isArray(this.sharedI18n.options.fallbackLng) ?
                this.sharedI18n.options.fallbackLng[0] : this.sharedI18n.options.fallbackLng;

            /*
             * make sure the fallback lng translation is intercepted by the missing key handler and eventually written to backend
             */
            const fallbackText = text.excludeFromTranslation ? I18nStoreImpl.wrapInBraces(text.text.trim()) : text.text.trim();
            const existingFallback: string = this.sharedI18n.getFixedT(fallbackLng, text.ns)(text.key, fallbackText)

            if (existingFallback !== fallbackText) {
                console.log("detected translation change: ", existingFallback, fallbackText)
                if (this.missingKeyStorage) {
                    this.missingKeyStorage.onFallbackLanguageValueChange(fallbackLng, text.ns, text.key, fallbackText)
                }
            }

            const details = this.sharedI18n.getFixedT(lng, text.ns)(text.key, {returnDetails: true})
            // console.log(">>>>>>>.... details", I18nStoreImpl.unwrapFromBraces(details.res), details, existingFallback)
            const translationExists = details.usedLng === lng && details.res && details.res.length > 0;
            if (translationExists) {
                // console.log("text is included in translation")
                // return I18nStoreImpl.unwrapFromBraces(details.res);
                if (text.excludeFromTranslation && details.res.length > 0) {
                    return I18nStoreImpl.unwrapFromBraces(details.res);
                } else {
                    return details.res;
                }
            } else if (text.excludeFromTranslation && existingFallback.length > 0) {
                // console.log("text is excluded from translation")
                return I18nStoreImpl.unwrapFromBraces(existingFallback);
            }

            return I18nStoreImpl.decorateUntranslated(lng, text, existingFallback);
        } else {
            return `${lng}.{${text.ns}:${text.key}}`
        }

    }

    private static wrapInBraces(text: string): string {
        if (text.length == 0) {
            return text;
        }
        return `{${text}}`
    }

    private static unwrapFromBraces(text: string): string {
        if (text.length == 0) {
            return text;
        }
        if (text.startsWith("{") && text.endsWith("}")) {
            return text.substring(1, text.length - 1);
        }
        return text;
    }

    private static decorateUntranslated(lng: string, text: NdTranslatableText, existingFallback: string) {
        return `<small style="font-size: 12px">n/a ${lng}:${text.ns}:${text.key}</small>[${existingFallback}]`;
    }

}


