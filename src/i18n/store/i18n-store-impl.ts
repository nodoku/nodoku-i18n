import {createInstance, i18n, InitOptions, Resource, ResourceKey, ResourceLanguage} from "i18next";
import {NdTranslatableText} from "nodoku-core";
import {delay, AbstractI18nStore} from "./abstract-i18n-store";
import {TranslationBackendClient} from "../backend/translation-backend-client";
import {MissingKeyStorage} from "../backend/missing-key-storage";
import {LanguageDefImpl} from "../util/language-def-impl";


export class I18nStoreImpl extends AbstractI18nStore {

    private sharedI18n: i18n | undefined = undefined;
    private isInitStarted: boolean = false;
    private client?: TranslationBackendClient;
    private missingKeyStorage?: MissingKeyStorage;

    private ref;

    private constructor() {
        super();
        this.ref = Math.random();
    }

    override getRef() {
        return this.ref;
    }


    public static createStore(): I18nStoreImpl {

        const store: I18nStoreImpl = new I18nStoreImpl();
        return store;
    }

    public async initStore(allLngs: readonly string[],
                           nampespaces: readonly string[],
                           fallbackLng: string,
                           saveMissing: boolean,
                           loadImmediately: boolean,
                           client: TranslationBackendClient,
                           missingKeyStorage: MissingKeyStorage): Promise<void> {

        console.log("this.sharedI18n defined", this.sharedI18n !== undefined)

        if (this.sharedI18n !== undefined) {



            if (loadImmediately) {
                console.log("this.sharedI18n defined, and refetching resources...")
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

        const instanceInCreation: i18n =  await this.createAndInitI18next(allLngs, nampespaces, fallbackLng, saveMissing, client, missingKeyStorage/*resourceLoader, missingKeyHandler*/);

        if (!loadImmediately) {
            await I18nStoreImpl.reloadResourcesForI18n(instanceInCreation);
        }

        this.sharedI18n = instanceInCreation;
        this.isInitStarted = false;

        console.log("this.sharedI18n defined", this.sharedI18n !== undefined, this.ref)

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
                                       missingKeyStorage: MissingKeyStorage): Promise<i18n> {

        this.client = client;
        const i18nInstance: i18n = createInstance()
        const options = this.createOptions(allLngs, namespaces, fallbackLng, saveMissing, client, missingKeyStorage);
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

            options.resources = await client.translationToResource(options.supportedLngs as readonly string[], namespaces);
            await i18nInstance.init(options)

            console.log("reloaded translation resources for ", (options.supportedLngs as string[]).join(", "),
                "fallbackLng", fallbackLng)

            const l: Resource = options.resources as Resource;
            const l1: ResourceLanguage = l["ru"];
            const l2: ResourceKey = l1["getting-started"]
            const l3 = (l2 as {[key: string]: string})["sectionName=getting-started-block-0.title"];
            console.log("this is l3", l3, i18nInstance.getFixedT("ru", "getting-started")("sectionName=getting-started-block-0.title", {returnDetails: true}))

        }

    }

    private createOptions(allLngs: readonly string[],
                          namespaces: readonly string[],
                          fallbackLng: string,
                          saveMissing: boolean,
                          client: TranslationBackendClient,
                          missingKeyStorage: MissingKeyStorage): InitOptions & {client: TranslationBackendClient} {


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
            initImmediate: true,
            client: client,
            missingKeyHandler: (lngs: readonly string[],
                                ns: string,
                                key: string,
                                fallbackValue: string,
                                updateMissing: boolean,
                                options: any) => missingKeyStorage.onMissingKey(lngs, ns, key, fallbackValue, updateMissing, options)
        }
    }

    public override translate(lng: string, ns: string, key: string): string {
        if (!this.sharedI18n) {
            return "translation n/a";
        }
        return this.sharedI18n.getFixedT(lng, ns)(key);
    }

    public override translateTranslatableText(lng: string, text: NdTranslatableText): string {

        // console.log("translating ", lng, text, I18nStore.sharedI18n ? "present" : "non-present")

        if (this.sharedI18n) {

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
            // console.log(">>>>>>>.... details", this.unwrapFromBraces(details.res), details, existingFallback)
            const translationExists = details.usedLng === lng && details.res && details.res.length > 0;
            if (translationExists) {
                // console.log("text is included in translation")
                return I18nStoreImpl.unwrapFromBraces(details.res);
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


