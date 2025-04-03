import { createInstance } from "i18next";
import { AbstractI18nStore } from "./abstract-i18n-store.js";
import { delay } from "../../index.js";
export class I18nStoreImpl extends AbstractI18nStore {
    constructor() {
        super();
        this.sharedI18n = undefined;
        this.isInitStarted = false;
        this.ref = Math.random();
    }
    static createStore() {
        return new I18nStoreImpl();
    }
    async initStore(allLngs, nampespaces, fallbackLng, saveMissing, loadOnInit, client, missingKeyStorage) {
        console.log("this.sharedI18n defined", this.sharedI18n !== undefined);
        if (this.sharedI18n !== undefined) {
            if (loadOnInit) {
                console.log("this.sharedI18n is already defined, refetching resources...");
                await I18nStoreImpl.reloadResourcesForI18n(this.sharedI18n);
            }
            return;
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
        console.log("creating and initializing i18next instance...", allLngs);
        const instanceInCreation = await this.createAndInitI18next(allLngs, nampespaces, fallbackLng, saveMissing, client, missingKeyStorage /*resourceLoader, missingKeyHandler*/);
        if (!loadOnInit) {
            await I18nStoreImpl.reloadResourcesForI18n(instanceInCreation);
        }
        this.sharedI18n = instanceInCreation;
        this.isInitStarted = false;
        this.missingKeyStorage = missingKeyStorage;
        // console.log("this.sharedI18n defined", this.sharedI18n !== undefined, this.ref)
    }
    allLanguages() {
        if (!this.client) {
            throw new Error("client is not initialized, call createAndInitI18next first");
        }
        return this.client.allLanguages();
    }
    async createAndInitI18next(allLngs, namespaces, fallbackLng, saveMissing, client, missingKeyStorage) {
        this.client = client;
        const i18nInstance = createInstance();
        const options = this.createOptions(allLngs, namespaces, fallbackLng, saveMissing, client, missingKeyStorage);
        options.resources = await client.translationToResource(options.supportedLngs, namespaces, fallbackLng);
        console.log("about to initialize instance i18next with options.resources", options.resources ? Object.keys(options.resources).length : "undef");
        await i18nInstance.init(options);
        return i18nInstance;
    }
    async reloadResources() {
        if (!this.sharedI18n) {
            console.log("WARNING: I18nStore is not initialized yet, call I18nStore.initStore first...");
            return;
        }
        await I18nStoreImpl.reloadResourcesForI18n(this.sharedI18n);
    }
    static async reloadResourcesForI18n(i18nInstance) {
        if (i18nInstance) {
            const options = i18nInstance.options;
            const namespaces = Array.isArray(options.ns) ? options.ns || [] : [options.ns];
            const fallbackLng = Array.isArray(options.fallbackLng) ? options.fallbackLng[0] : options.fallbackLng;
            const client = options.client;
            options.resources = await client.translationToResource(options.supportedLngs, namespaces, fallbackLng);
            // await i18nInstance.init(options)
            console.log("reloaded translation resources for ", options.supportedLngs.join(", "), "fallbackLng", fallbackLng);
        }
    }
    createOptions(allLngs, namespaces, fallbackLng, saveMissing, client, missingKeyStorage) {
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
            saveMissingTo: "fallback" /*"current"*/,
            ignoreJSONStructure: false,
            missingKeyHandler: (lngs, ns, key, fallbackValue, updateMissing, options) => missingKeyStorage.onMissingKey(lngs, ns, key, fallbackValue, updateMissing, options)
        };
    }
    translateTranslatableText(lng, text) {
        // console.log("translating ", lng, text, I18nStore.sharedI18n ? "present" : "non-present")
        if (this.sharedI18n) {
            if (this.missingKeyStorage) {
                this.missingKeyStorage.onExistingKey(text.ns, text.key);
            }
            const fallbackLng = Array.isArray(this.sharedI18n.options.fallbackLng) ?
                this.sharedI18n.options.fallbackLng[0] : this.sharedI18n.options.fallbackLng;
            /*
             * make sure the fallback lng translation is intercepted by the missing key handler and eventually written to backend
             */
            const fallbackText = text.excludeFromTranslation ? I18nStoreImpl.wrapInBraces(text.text.trim()) : text.text.trim();
            const existingFallback = this.sharedI18n.getFixedT(fallbackLng, text.ns)(text.key, fallbackText);
            if (existingFallback !== fallbackText) {
                console.log("detected translation change: ", existingFallback, fallbackText);
                if (this.missingKeyStorage) {
                    this.missingKeyStorage.onFallbackLanguageValueChange(fallbackLng, text.ns, text.key, fallbackText);
                }
            }
            const details = this.sharedI18n.getFixedT(lng, text.ns)(text.key, { returnDetails: true });
            // console.log(">>>>>>>.... details", I18nStoreImpl.unwrapFromBraces(details.res), details, existingFallback)
            const translationExists = details.usedLng === lng && details.res && details.res.length > 0;
            if (translationExists) {
                // console.log("text is included in translation")
                // return I18nStoreImpl.unwrapFromBraces(details.res);
                if (text.excludeFromTranslation && details.res.length > 0) {
                    return I18nStoreImpl.unwrapFromBraces(details.res);
                }
                else {
                    return details.res;
                }
            }
            else if (text.excludeFromTranslation && existingFallback.length > 0) {
                // console.log("text is excluded from translation")
                return I18nStoreImpl.unwrapFromBraces(existingFallback);
            }
            return I18nStoreImpl.decorateUntranslated(lng, text, existingFallback);
        }
        else {
            return `${lng}.{${text.ns}:${text.key}}`;
        }
    }
    static wrapInBraces(text) {
        if (text.length == 0) {
            return text;
        }
        return `{${text}}`;
    }
    static unwrapFromBraces(text) {
        if (text.length == 0) {
            return text;
        }
        if (text.startsWith("{") && text.endsWith("}")) {
            return text.substring(1, text.length - 1);
        }
        return text;
    }
    static decorateUntranslated(lng, text, existingFallback) {
        return `<small style="font-size: 12px">n/a ${lng}:${text.ns}:${text.key}</small>[${existingFallback}]`;
    }
}
