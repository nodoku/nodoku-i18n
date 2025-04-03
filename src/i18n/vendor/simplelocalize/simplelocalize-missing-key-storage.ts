import * as fs from "node:fs";
import path from "path";
import {Dictionary, UpdatedKey, UpdatingValue} from "../../util/dictionary.js";
import {
    MissingKeyStorageImpl,
    OnFallbackLngTextUpdateStrategyImpl,
    OnMissingKeyStrategyImpl
} from "../../backend/missing-key-storage.js";
import {TranslationBackendClient} from "../../backend/translation-backend-client.js";
import {TranslationKey} from "../../util/dictionary.js";


export class SimplelocalizeMissingKeyStorage extends MissingKeyStorageImpl {

    private existingKeysRequests: Dictionary<TranslationKey, string> = new Dictionary<TranslationKey, string>();
    private missingKeysRequests: Dictionary<UpdatedKey, string> = new Dictionary<UpdatedKey, string>();
    private fallbackLanguageValuesToBeUpdated: Dictionary<UpdatedKey, string> = new Dictionary<UpdatedKey, string>();

    // private i18nStore: AbstractI18nStore;
    private client: TranslationBackendClient;
    private onFallbackLngTextUpdateStrategy: OnFallbackLngTextUpdateStrategyImpl;
    private onMissingKeyStrategy: OnMissingKeyStrategyImpl;
    private onMissingKeyReload: () => Promise<void>;


    constructor(client: TranslationBackendClient,
                //i18nStore: AbstractI18nStore,
                onMissingKeyReload: () => Promise<void>,
                onMissingKeyStrategy: OnMissingKeyStrategyImpl,
                onFallbackLngTextUpdateStrategy: OnFallbackLngTextUpdateStrategyImpl) {
        super();
        // this.i18nStore = i18nStore;
        this.client = client;
        this.onMissingKeyStrategy = onMissingKeyStrategy;
        this.onFallbackLngTextUpdateStrategy = onFallbackLngTextUpdateStrategy;
        this.onMissingKeyReload = onMissingKeyReload

        if (onMissingKeyStrategy === OnMissingKeyStrategyImpl.upload) {
            setInterval(() => this.pushMissingKeys(this.client), 10000)
        }
    }


    public override onMissingKey(lngs: readonly string[], ns: string, key: string, fallbackValue: string, updateMissing: boolean, options: any) {

        console.log("received missing key: ", lngs, ns, key, fallbackValue, updateMissing, options/*, I18nStore.getI18nByLangByNs('ru')?.store.data*/);

        // throw new Error("received missing key: " + lngs + ns +  key + fallbackValue)

        if (updateMissing) {
            /*
             * this is normally taken care of by onFallbackLanguageValueChange
             */
            return;
        }

        lngs.forEach((lng) => {

            const missingKey: UpdatedKey = {language: lng, namespace: ns, key: key};
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
        })


    }


    public override onExistingKey(ns: string, key: string) {
        // console.log("received existing key", ns, key)
        if (!this.existingKeysRequests.has({namespace: ns, key: key})) {
            this.existingKeysRequests.set({namespace: ns, key: key}, "exists");
            if (this.onMissingKeyStrategy === OnMissingKeyStrategyImpl.save_to_file) {
                // this.dumpToFile();
                fs.appendFileSync(path.resolve("./existing-keys.csv"), `${ns},${key}\n`);
            }
        }
    }

    public override onFallbackLanguageValueChange(language: string, namespace: string, key: string, text: string): void {

        const missingKey: UpdatedKey = {language: language, namespace: namespace, key: key};

        this.fallbackLanguageValuesToBeUpdated.set(missingKey, text)

        if (this.onMissingKeyStrategy === OnMissingKeyStrategyImpl.save_to_file) {
            // this.dumpToFile();
            fs.appendFileSync(path.resolve("./updated-keys.csv"), `${language},${namespace},${key},${this.toBase64(text)}\n`);
        }

    }

    private toBase64(str: string): string {
        if (!str) {
            return str;
        }
        return Buffer.from(str).toString('base64')
    }


    public override async pushMissingKeys(client: TranslationBackendClient): Promise<void> {

        const shoulReload =
            this.missingKeysRequests.size() > 0 ||
            this.fallbackLanguageValuesToBeUpdated.size() > 0;

        await SimplelocalizeMissingKeyStorage.pushMissingKeysForClient(client, this.missingKeysRequests)
        await SimplelocalizeMissingKeyStorage.pushUpdatedKeysForClient(client, this.fallbackLanguageValuesToBeUpdated, this.onFallbackLngTextUpdateStrategy)

        if (shoulReload && this.onMissingKeyReload) {
            // await this.i18nStore.reloadResources();
            await this.onMissingKeyReload();
            console.log("resources reloaded...")
        }

        this.missingKeysRequests = new Dictionary<UpdatedKey, string>();
        this.fallbackLanguageValuesToBeUpdated = new Dictionary<UpdatedKey, string>();

    }

    public static async pushMissingKeysForClient(client: TranslationBackendClient,
                                                 missingKeysRequests: Dictionary<UpdatedKey, string>): Promise<void> {

        if (missingKeysRequests.size() > 0) {

            console.log("pushing missing keys: ", missingKeysRequests.size())

            const chunks: UpdatingValue[][] =
                SimplelocalizeMissingKeyStorage.flatReqsChunked(missingKeysRequests, 100)

            for (const reqs of chunks) {
                await client.pushKeys(reqs.map((r: UpdatingValue) => r.updKey))
                await client.updateTranslations(reqs)

                // reqs.forEach((v: UpdatingValue) => {
                //     this.missingKeysRequests.delete(v.updKey)
                // })
            }

        }

    }

    public static async removeUnusedKeysForClient(client: TranslationBackendClient,
                                                  existingKeysRequests: Dictionary<TranslationKey, string>): Promise<void> {

        if (existingKeysRequests.size() > 0) {

            console.log("removing unused keys, existing keys size ", existingKeysRequests.size())

            const allTranslationKeys: TranslationKey[] = await client.getAllTranslationKeys();

            const toDelete: TranslationKey[] = [];
            allTranslationKeys.forEach((k: TranslationKey) => {
                if (!existingKeysRequests.has(k)) {
                    // console.log("to delete key", k, existingKeysRequests.get(k))
                    toDelete.push(k);
                }
            })

            console.log("determined keys to delete: ", toDelete.length, toDelete);

            await client.deleteKeys(toDelete)

            console.log("deleted keys", toDelete)
        }

    }

    public static async pushUpdatedKeysForClient(client: TranslationBackendClient,
                                                 fallbackLanguageValuesToBeUpdated: Dictionary<UpdatedKey, string>,
                                                 onFallbackLngTextUpdateStrategy: OnFallbackLngTextUpdateStrategyImpl): Promise<void> {

        console.log("pushing updated keys: ", fallbackLanguageValuesToBeUpdated.size())


        if (fallbackLanguageValuesToBeUpdated.size() > 0) {

            const chunks: UpdatingValue[][] =
                SimplelocalizeMissingKeyStorage.flatReqsChunked(fallbackLanguageValuesToBeUpdated, 100)


            for (const reqs of chunks) {
                switch (onFallbackLngTextUpdateStrategy)  {
                    case OnFallbackLngTextUpdateStrategyImpl.delete_translations:
                        await client.deleteKeys(reqs.map(k => k.updKey))
                        await client.pushKeys(reqs.map(k => k.updKey))
                        break;
                    case OnFallbackLngTextUpdateStrategyImpl.reset_reviewed_status:
                        await client.removeReviewedStatus(reqs)
                        break;
                    case OnFallbackLngTextUpdateStrategyImpl.update_fallback_lng_only:
                        //
                        break;
                }

                await client.updateTranslations(reqs)

                // reqs.forEach((v: UpdatingValue) => {
                //     this.fallbackLanguageValuesToBeUpdated.delete(v.updKey)
                // })
            }
        }


    }

    private static flatReqsChunked(reqsAsMap: Dictionary<UpdatedKey, string>, chunkSize: number): UpdatingValue[][] {
        const flatReqs: UpdatingValue[] = [];
        reqsAsMap.entries().forEach((v) => {
            flatReqs.push({updKey: {language: v[0].language, namespace: v[0].namespace, key: v[0].key}, text: v[1]});
        })

        // console.log(flatReqs[0])

        const chunks: UpdatingValue[][] = []
        for (let i = 0; i < flatReqs.length; i += chunkSize) {
            chunks.push(flatReqs.slice(i, i + chunkSize));
        }

        return chunks;
    }


}