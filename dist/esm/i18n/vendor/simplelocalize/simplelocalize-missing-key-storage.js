import * as fs from "node:fs";
import path from "path";
import { Dictionary } from "../../util/dictionary.js";
import { MissingKeyStorage } from "../../backend/missing-key-storage.js";
import { OnFallbackLngTextUpdateStrategyImpl } from "./simplelocalize-backend-api-client.js";
import { OnMissingKeyStrategyImpl } from "./simplelocalize-backend-api-client.js";
export class SimplelocalizeMissingKeyStorage extends MissingKeyStorage {
    constructor(i18nStore, onMissingKeyStrategy, onFallbackLngTextUpdateStrategy) {
        super();
        this.missingKeysRequests = new Dictionary();
        this.fallbackLanguageValuesToBeUpdated = new Dictionary();
        this.i18nStore = i18nStore;
        this.onMissingKeyStrategy = onMissingKeyStrategy;
        this.onFallbackLngTextUpdateStrategy = onFallbackLngTextUpdateStrategy;
    }
    onMissingKey(lngs, ns, key, fallbackValue, updateMissing, options) {
        console.log("received missing key: ", lngs, ns, key, fallbackValue /*, I18nStore.getI18nByLangByNs('ru')?.store.data*/);
        lngs.forEach((lng) => {
            const missingKey = { language: lng, namespace: ns, key: key };
            /*
             * by checking the presence of the key we ensure that only the first update will be taken into account
             * here we rely on the fact that the fallback lng translation is queried first
             * see I18nStore.i18nForNodokuImpl for details, when i18n.getFixedT is called prior to i18n.t
             */
            if (!this.missingKeysRequests.has(missingKey)) {
                this.missingKeysRequests.set(missingKey, fallbackValue);
            }
        });
        if (this.onMissingKeyStrategy === OnMissingKeyStrategyImpl.save_to_file) {
            this.dumpToFile();
        }
    }
    dumpToFile() {
        fs.writeFileSync(path.resolve("./missing-keys.json"), JSON.stringify({
            missing: this.missingKeysRequests.entries(),
            updated: this.fallbackLanguageValuesToBeUpdated.entries()
        }));
    }
    onFallbackLanguageValueChange(language, namespace, key, text) {
        const missingKey = { language: language, namespace: namespace, key: key };
        this.fallbackLanguageValuesToBeUpdated.set(missingKey, text);
        if (this.onMissingKeyStrategy === OnMissingKeyStrategyImpl.save_to_file) {
            this.dumpToFile();
        }
    }
    async pushMissingKeys(client) {
        const shoulReload = this.missingKeysRequests.size() > 0 ||
            this.fallbackLanguageValuesToBeUpdated.size() > 0;
        await SimplelocalizeMissingKeyStorage.pushMissingKeysForClient(client, this.missingKeysRequests, this.fallbackLanguageValuesToBeUpdated, this.onFallbackLngTextUpdateStrategy);
        if (shoulReload) {
            await this.i18nStore.reloadResources();
            console.log("resources reloaded...");
        }
        this.missingKeysRequests = new Dictionary();
        this.fallbackLanguageValuesToBeUpdated = new Dictionary();
    }
    static async pushMissingKeysForClient(client, missingKeysRequests, fallbackLanguageValuesToBeUpdated, onFallbackLngTextUpdateStrategy) {
        if (missingKeysRequests.size() > 0) {
            console.log("pushing missing keys: ", missingKeysRequests.size(), ", fallbackLanguageValuesToBeUpdated", fallbackLanguageValuesToBeUpdated.size());
            const chunks = SimplelocalizeMissingKeyStorage.flatReqsChunked(missingKeysRequests, 100);
            for (const reqs of chunks) {
                await client.pushKeys(reqs.map((r) => r.updKey));
                await client.updateTranslations(reqs);
                // reqs.forEach((v: UpdatingValue) => {
                //     this.missingKeysRequests.delete(v.updKey)
                // })
            }
        }
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
        console.log(flatReqs[0]);
        const chunks = [];
        for (let i = 0; i < flatReqs.length; i += chunkSize) {
            chunks.push(flatReqs.slice(i, i + chunkSize));
        }
        return chunks;
    }
}
