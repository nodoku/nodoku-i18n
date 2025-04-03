import * as fs from "node:fs";
import path from "path";
import { Dictionary } from "../../util/dictionary.js";
import { MissingKeyStorageImpl, OnFallbackLngTextUpdateStrategyImpl, OnMissingKeyStrategyImpl } from "../../backend/missing-key-storage.js";
export class SimplelocalizeMissingKeyStorage extends MissingKeyStorageImpl {
    constructor(client, 
    //i18nStore: AbstractI18nStore,
    onMissingKeyReload, onMissingKeyStrategy, onFallbackLngTextUpdateStrategy) {
        super();
        this.existingKeysRequests = new Dictionary();
        this.missingKeysRequests = new Dictionary();
        this.fallbackLanguageValuesToBeUpdated = new Dictionary();
        // this.i18nStore = i18nStore;
        this.client = client;
        this.onMissingKeyStrategy = onMissingKeyStrategy;
        this.onFallbackLngTextUpdateStrategy = onFallbackLngTextUpdateStrategy;
        this.onMissingKeyReload = onMissingKeyReload;
        if (onMissingKeyStrategy === OnMissingKeyStrategyImpl.upload) {
            setInterval(() => this.pushMissingKeys(this.client), 10000);
        }
    }
    onMissingKey(lngs, ns, key, fallbackValue, updateMissing, options) {
        console.log("received missing key: ", lngs, ns, key, fallbackValue, updateMissing, options /*, I18nStore.getI18nByLangByNs('ru')?.store.data*/);
        // throw new Error("received missing key: " + lngs + ns +  key + fallbackValue)
        if (updateMissing) {
            /*
             * this is normally taken care of by onFallbackLanguageValueChange
             */
            return;
        }
        lngs.forEach((lng) => {
            const missingKey = { language: lng, namespace: ns, key: key };
            /*
             * by checking the presence of the key we ensure that only the first update will be taken into account
             * here we rely on the fact that the fallback lng translation is queried first
             * see I18nStore.i18nForNodokuImpl for details, when i18n.getFixedT is called prior to i18n.t
             */
            if (!this.missingKeysRequests.has(missingKey)) {
                this.missingKeysRequests.set(missingKey, fallbackValue);
                if (this.onMissingKeyStrategy === OnMissingKeyStrategyImpl.save_to_file) {
                    // this.dumpToFile();
                    fs.appendFileSync(path.resolve("./missing-keys.csv"), `${lng},${ns},${key},${this.toBase64(fallbackValue)}\n`);
                }
            }
        });
    }
    onExistingKey(ns, key) {
        // console.log("received existing key", ns, key)
        if (!this.existingKeysRequests.has({ namespace: ns, key: key })) {
            this.existingKeysRequests.set({ namespace: ns, key: key }, "exists");
            if (this.onMissingKeyStrategy === OnMissingKeyStrategyImpl.save_to_file) {
                // this.dumpToFile();
                fs.appendFileSync(path.resolve("./existing-keys.csv"), `${ns},${key}\n`);
            }
        }
    }
    onFallbackLanguageValueChange(language, namespace, key, text) {
        const missingKey = { language: language, namespace: namespace, key: key };
        this.fallbackLanguageValuesToBeUpdated.set(missingKey, text);
        if (this.onMissingKeyStrategy === OnMissingKeyStrategyImpl.save_to_file) {
            // this.dumpToFile();
            fs.appendFileSync(path.resolve("./updated-keys.csv"), `${language},${namespace},${key},${this.toBase64(text)}\n`);
        }
    }
    toBase64(str) {
        if (!str) {
            return str;
        }
        return Buffer.from(str).toString('base64');
    }
    async pushMissingKeys(client) {
        const shoulReload = this.missingKeysRequests.size() > 0 ||
            this.fallbackLanguageValuesToBeUpdated.size() > 0;
        await SimplelocalizeMissingKeyStorage.pushMissingKeysForClient(client, this.missingKeysRequests);
        await SimplelocalizeMissingKeyStorage.pushUpdatedKeysForClient(client, this.fallbackLanguageValuesToBeUpdated, this.onFallbackLngTextUpdateStrategy);
        if (shoulReload && this.onMissingKeyReload) {
            // await this.i18nStore.reloadResources();
            await this.onMissingKeyReload();
            console.log("resources reloaded...");
        }
        this.missingKeysRequests = new Dictionary();
        this.fallbackLanguageValuesToBeUpdated = new Dictionary();
    }
    static async pushMissingKeysForClient(client, missingKeysRequests) {
        if (missingKeysRequests.size() > 0) {
            console.log("pushing missing keys: ", missingKeysRequests.size());
            const chunks = SimplelocalizeMissingKeyStorage.flatReqsChunked(missingKeysRequests, 100);
            for (const reqs of chunks) {
                await client.pushKeys(reqs.map((r) => r.updKey));
                await client.updateTranslations(reqs);
                // reqs.forEach((v: UpdatingValue) => {
                //     this.missingKeysRequests.delete(v.updKey)
                // })
            }
        }
    }
    static async removeUnusedKeysForClient(client, existingKeysRequests) {
        if (existingKeysRequests.size() > 0) {
            console.log("removing unused keys, existing keys size ", existingKeysRequests.size());
            const allTranslationKeys = await client.getAllTranslationKeys();
            const toDelete = [];
            allTranslationKeys.forEach((k) => {
                if (!existingKeysRequests.has(k)) {
                    // console.log("to delete key", k, existingKeysRequests.get(k))
                    toDelete.push(k);
                }
            });
            console.log("determined keys to delete: ", toDelete.length, toDelete);
            await client.deleteKeys(toDelete);
            console.log("deleted keys", toDelete);
        }
    }
    static async pushUpdatedKeysForClient(client, fallbackLanguageValuesToBeUpdated, onFallbackLngTextUpdateStrategy) {
        console.log("pushing updated keys: ", fallbackLanguageValuesToBeUpdated.size());
        if (fallbackLanguageValuesToBeUpdated.size() > 0) {
            const chunks = SimplelocalizeMissingKeyStorage.flatReqsChunked(fallbackLanguageValuesToBeUpdated, 100);
            for (const reqs of chunks) {
                switch (onFallbackLngTextUpdateStrategy) {
                    case OnFallbackLngTextUpdateStrategyImpl.delete_translations:
                        await client.deleteKeys(reqs.map(k => k.updKey));
                        await client.pushKeys(reqs.map(k => k.updKey));
                        break;
                    case OnFallbackLngTextUpdateStrategyImpl.reset_reviewed_status:
                        await client.removeReviewedStatus(reqs);
                        break;
                    case OnFallbackLngTextUpdateStrategyImpl.update_fallback_lng_only:
                        //
                        break;
                }
                await client.updateTranslations(reqs);
                // reqs.forEach((v: UpdatingValue) => {
                //     this.fallbackLanguageValuesToBeUpdated.delete(v.updKey)
                // })
            }
        }
    }
    static flatReqsChunked(reqsAsMap, chunkSize) {
        const flatReqs = [];
        reqsAsMap.entries().forEach((v) => {
            flatReqs.push({ updKey: { language: v[0].language, namespace: v[0].namespace, key: v[0].key }, text: v[1] });
        });
        // console.log(flatReqs[0])
        const chunks = [];
        for (let i = 0; i < flatReqs.length; i += chunkSize) {
            chunks.push(flatReqs.slice(i, i + chunkSize));
        }
        return chunks;
    }
}
