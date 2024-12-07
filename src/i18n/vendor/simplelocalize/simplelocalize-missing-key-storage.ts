import * as fs from "node:fs";
import path from "path";
import {Dictionary, UpdatedKey, UpdatingValue} from "../../util/dictionary.js";
import {MissingKeyStorage} from "../../backend/missing-key-storage.js";
import {OnFallbackLngTextUpdateStrategyImpl} from "./simplelocalize-backend-api-client.js";
import {OnMissingKeyStrategyImpl} from "./simplelocalize-backend-api-client.js";
import {TranslationBackendClient} from "../../backend/translation-backend-client.js";
import {AbstractI18nStore} from "../../store/abstract-i18n-store";
import {NodokuI18n} from "../../../index.js";
import OnFallbackLngTextUpdateStrategy = NodokuI18n.Simplelocalize.OnFallbackLngTextUpdateStrategy;
import OnMissingKeyStrategy = NodokuI18n.Simplelocalize.OnMissingKeyStrategy;


export class SimplelocalizeMissingKeyStorage extends MissingKeyStorage {

    private missingKeysRequests: Dictionary<UpdatedKey, string> = new Dictionary<UpdatedKey, string>();
    private fallbackLanguageValuesToBeUpdated: Dictionary<UpdatedKey, string> = new Dictionary<UpdatedKey, string>();

    private i18nStore: AbstractI18nStore;
    private onFallbackLngTextUpdateStrategy: OnFallbackLngTextUpdateStrategy;
    private onMissingKeyStrategy: OnMissingKeyStrategy;


    constructor(i18nStore: AbstractI18nStore,
                onMissingKeyStrategy: OnMissingKeyStrategy,
                onFallbackLngTextUpdateStrategy: OnFallbackLngTextUpdateStrategy) {
        super();
        this.i18nStore = i18nStore;
        this.onMissingKeyStrategy = onMissingKeyStrategy;
        this.onFallbackLngTextUpdateStrategy = onFallbackLngTextUpdateStrategy;
    }


    public override onMissingKey(lngs: readonly string[], ns: string, key: string, fallbackValue: string, updateMissing: boolean, options: any) {

        console.log("received missing key: ", lngs, ns, key, fallbackValue/*, I18nStore.getI18nByLangByNs('ru')?.store.data*/);

        lngs.forEach((lng) => {

            const missingKey: UpdatedKey = {language: lng, namespace: ns, key: key};
            /*
             * by checking the presence of the key we ensure that only the first update will be taken into account
             * here we rely on the fact that the fallback lng translation is queried first
             * see I18nStore.i18nForNodokuImpl for details, when i18n.getFixedT is called prior to i18n.t
             */
            if (!this.missingKeysRequests.has(missingKey)) {
                this.missingKeysRequests.set(missingKey, fallbackValue);
            }
        })

        if (this.onMissingKeyStrategy === OnMissingKeyStrategyImpl.save_to_file) {
            this.dumpToFile();
        }

    }


    private dumpToFile(): void {
        fs.writeFileSync(path.resolve("./missing-keys.json"),
            JSON.stringify({
                missing: this.missingKeysRequests.entries(),
                updated: this.fallbackLanguageValuesToBeUpdated.entries()
            }));
    }


    override onFallbackLanguageValueChange(language: string, namespace: string, key: string, text: string): void {

        const missingKey: UpdatedKey = {language: language, namespace: namespace, key: key};

        this.fallbackLanguageValuesToBeUpdated.set(missingKey, text)

        if (this.onMissingKeyStrategy === OnMissingKeyStrategyImpl.save_to_file) {
            this.dumpToFile();
        }

    }



    public override async pushMissingKeys(client: TranslationBackendClient): Promise<void> {

        const shoulReload =
            this.missingKeysRequests.size() > 0 ||
            this.fallbackLanguageValuesToBeUpdated.size() > 0;

        await SimplelocalizeMissingKeyStorage.pushMissingKeysForClient(client, this.missingKeysRequests, this.fallbackLanguageValuesToBeUpdated, this.onFallbackLngTextUpdateStrategy)

        if (shoulReload) {
            await this.i18nStore.reloadResources();
            console.log("resources reloaded...")
        }

        this.missingKeysRequests = new Dictionary<UpdatedKey, string>();
        this.fallbackLanguageValuesToBeUpdated = new Dictionary<UpdatedKey, string>();

    }

    public static async pushMissingKeysForClient(client: TranslationBackendClient,
                                                 missingKeysRequests: Dictionary<UpdatedKey, string>,
                                                 fallbackLanguageValuesToBeUpdated: Dictionary<UpdatedKey, string>,
                                                 onFallbackLngTextUpdateStrategy: OnFallbackLngTextUpdateStrategy): Promise<void> {

        if (missingKeysRequests.size() > 0) {

            console.log("pushing missing keys: ", missingKeysRequests.size(),
                ", fallbackLanguageValuesToBeUpdated", fallbackLanguageValuesToBeUpdated.size())

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