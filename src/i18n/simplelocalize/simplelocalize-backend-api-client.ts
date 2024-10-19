import LanguageDefImpl from "../language-def-impl";
import {
    I18nStore,
    LanguageNsTranslationResource,
    MissingKeyHandler,
    TranslationResourceLoader,
    UpdatedKey
} from "../i18n-store";
import {Dictionary} from "../dictionary";
import {NodokuI18n} from "../../index";
import LanguageDef = NodokuI18n.LanguageDef;

export const projectToken = process.env.SIMPLELOCALIZE_PROJECT_TOKEN;
export const cdnBaseUrl = "https://cdn.simplelocalize.io";
export const environment = "_latest"; // or "_production"

export const apiKey: string = process.env.SIMPLELOCALIZE_API_KEY ? process.env.SIMPLELOCALIZE_API_KEY : "n-a";

export const loadPathBase = `${cdnBaseUrl}/${projectToken}/${environment}`;

const loadTranslationsApiBase = "https://api.simplelocalize.io/api/v2/translations";


interface UpdatingValue {
    updKey: UpdatedKey;
    text: string;
}


export enum OnFallbackLngTextUpdateStrategyImpl {
    update_fallback_lng_only,
    delete_translations,
    reset_reviewed_status
}


export class SimplelocalizeBackendApiClient {

    static endpointUpdateKeys = "https://api.simplelocalize.io/api/v2/translations/bulk"
    static endpointUploadKeys = "https://api.simplelocalize.io/api/v1/translation-keys/bulk"

    private static missingKeysRequests: Dictionary<UpdatedKey, string> = new Dictionary<UpdatedKey, string>();
    private static fallbackLanguageValuesToBeUpdated: Dictionary<UpdatedKey, string> = new Dictionary<UpdatedKey, string>();

    public static onFallbackLngTextUpdateStrategy: OnFallbackLngTextUpdateStrategyImpl = OnFallbackLngTextUpdateStrategyImpl.update_fallback_lng_only;


    static async allLanguagesImpl(): Promise<LanguageDefImpl[]> {
        const resp = await fetch(`${loadPathBase}/_languages`);
        if (!resp.ok) {
            throw new Error("can't load languages: " + resp.status + ", " + (await resp.text()));
        }
        return (await resp.json()).map((l: LanguageDefImpl) => {
            if (!l.icon) {
                l.icon = l.key;
            }
            if (l.key == 'en') {
                l.icon = 'gb';
            }
            return l;
        })
    }



    public static missingKeyHandler: MissingKeyHandler = (lngs: readonly string[],
                                                          ns: string,
                                                          key: string,
                                                          fallbackValue: string,
                                                          updateMissing: boolean,
                                                          options: any): void => {

        console.log("received missing key: ", lngs, ns, key, fallbackValue, I18nStore.getI18nByLangByNs('ru')?.store.data);

        lngs.forEach((lng) => {

            const missingKey: UpdatedKey = {language: lng, namespace: ns, key: key};
            /*
             * by checking the presence of the key we ensure that only the first update will be taken into account
             * here we rely on the fact that the fallback lng translation is queried first
             * see i18nForNodokuImpl for details, when i18n.getFixedT is called prior to i18n.t
             */
            if (!SimplelocalizeBackendApiClient.missingKeysRequests.has(missingKey)) {
                SimplelocalizeBackendApiClient.missingKeysRequests.set(missingKey, fallbackValue);
            }
        })

    }


    static onFallbackLanguageValueChange(language: string, namespace: string, key: string, text: string): void {

        const missingKey: UpdatedKey = {language: language, namespace: namespace, key: key};

        SimplelocalizeBackendApiClient.fallbackLanguageValuesToBeUpdated.set(missingKey, text)

    }

    static resourceLoader: TranslationResourceLoader = environment === '_latest' ?
        SimplelocalizeBackendApiClient.loadTranslationsUsingApi :
        SimplelocalizeBackendApiClient.loadTranslationsUsingCdn;

    private static async loadTranslationsUsingCdn(language: string, ns: string): Promise<LanguageNsTranslationResource> {
        console.log("querying the language on CDN", language, " on namespace ", ns, "url", `${loadPathBase}/${language}/${ns}`);
        const resp = await fetch(`${loadPathBase}/${language}/${ns}`);
        const reply = await resp.json();
        console.log("this is reply", language, ns, reply);
        return reply;
    }

    private static async loadTranslationsUsingApi(language: string, ns: string): Promise<LanguageNsTranslationResource> {
        console.log("querying the language ", language, " on namespace ", ns, "url", `${loadTranslationsApiBase}?namespace=${ns}&language=${language}`);
        let finished = false;
        let page = 0;
        const translatedReply: LanguageNsTranslationResource = {};
        while (!finished) {
            const resp = await fetch(`${loadTranslationsApiBase}?namespace=${ns}&language=${language}&page=${page}`, {
                method: 'GET',
                mode: 'cors',
                headers: {
                    'Content-Type': 'application/json',
                    'X-SimpleLocalize-Token': apiKey
                },
                cache: 'no-cache'
            })
            const reply = await resp.json();
            reply.data.forEach((t: any) => {
                translatedReply[t.key] = t.text;
            });

            page++;
            finished = reply.data.length == 0;
        }
        // console.log("translatedReply", language, ns, translatedReply)
        return translatedReply;
    }

    static async pushMissingKeys() {

        const shoulReload =
            SimplelocalizeBackendApiClient.missingKeysRequests.size() > 0 ||
            SimplelocalizeBackendApiClient.fallbackLanguageValuesToBeUpdated.size() > 0;

        if (SimplelocalizeBackendApiClient.missingKeysRequests.size() > 0) {

            const chunks: UpdatingValue[][] =
                SimplelocalizeBackendApiClient.flatReqsChunked(SimplelocalizeBackendApiClient.missingKeysRequests, 100)

            for (const reqs of chunks) {
                await SimplelocalizeBackendApiClient.pushKeys(reqs.map(r => r.updKey))
                await SimplelocalizeBackendApiClient.updateTranslations(reqs)

                reqs.forEach((v: UpdatingValue) => {
                    SimplelocalizeBackendApiClient.missingKeysRequests.delete(v.updKey)
                })
            }

        }

        if (SimplelocalizeBackendApiClient.fallbackLanguageValuesToBeUpdated.size() > 0) {

            const chunks: UpdatingValue[][] =
                SimplelocalizeBackendApiClient.flatReqsChunked(SimplelocalizeBackendApiClient.fallbackLanguageValuesToBeUpdated, 100)


            for (const reqs of chunks) {
                if (SimplelocalizeBackendApiClient.onFallbackLngTextUpdateStrategy === OnFallbackLngTextUpdateStrategyImpl.delete_translations) {
                    await SimplelocalizeBackendApiClient.deleteKeys(reqs.map(k => k.updKey))
                    await SimplelocalizeBackendApiClient.pushKeys(reqs.map(k => k.updKey))
                } else if (SimplelocalizeBackendApiClient.onFallbackLngTextUpdateStrategy === OnFallbackLngTextUpdateStrategyImpl.reset_reviewed_status) {
                    await SimplelocalizeBackendApiClient.removeReviewed(reqs)
                } else if (SimplelocalizeBackendApiClient.onFallbackLngTextUpdateStrategy === OnFallbackLngTextUpdateStrategyImpl.update_fallback_lng_only) {
                    //
                }
                await SimplelocalizeBackendApiClient.updateTranslations(reqs)

                reqs.forEach((v: UpdatingValue) => {
                    SimplelocalizeBackendApiClient.fallbackLanguageValuesToBeUpdated.delete(v.updKey)
                })
            }
        }

    }



    private static async pushKeys(reqs: UpdatedKey[]): Promise<void> {
        const requestBodyKeys = {
            translationKeys: reqs.map((r: UpdatedKey) => {return {key: r.key, namespace: r.namespace}})
        }
        const resp = await fetch(SimplelocalizeBackendApiClient.endpointUploadKeys, {
            method: 'POST',
            mode: 'cors',
            headers: {
                'Content-Type': 'application/json',
                'X-SimpleLocalize-Token': apiKey
            },
            body: JSON.stringify(requestBodyKeys),
        });
        const json = await resp.json();
        console.log("pushed keys", requestBodyKeys, JSON.stringify(json))

    }

    private static async updateTranslations(reqs: UpdatingValue[]): Promise<void> {
        const requestBodyTranslations = {
            translations: reqs.map(r => {return {...r.updKey, text: r.text, reviewStatus: "REVIEWED"}})
        }

        // console.log(`[SimpleLocalize] Pushing updated translations: ${reqs.length}`, requestBodyTranslations);

        const resp: Response = await fetch(SimplelocalizeBackendApiClient.endpointUpdateKeys, {
            method: 'PATCH',
            mode: 'cors',
            headers: {
                'Content-Type': 'application/json',
                'X-SimpleLocalize-Token': apiKey
            },
            body: JSON.stringify(requestBodyTranslations),
        })
        const json = await resp.json();
        console.log("updated translations", requestBodyTranslations, JSON.stringify(json));

    }

    private static async removeReviewed(reqs: UpdatingValue[]): Promise<void> {


        const requestBodyTranslations: {
            translations: {
                language: string,
                namespace: string,
                key: string,
                text: string,
                reviewStatus: "REVIEWED" | "NOT_REVIEWED"
            }[],
        } = {
            translations: []
        }

        const allLanguages: LanguageDef[] = await SimplelocalizeBackendApiClient.allLanguagesImpl();

        reqs.forEach(r => {

            allLanguages
                .forEach(lng => {

                    requestBodyTranslations.translations.push({
                        language: lng.key,
                        namespace: r.updKey.namespace,
                        key: r.updKey.key,
                        text: I18nStore.translate(/*li18n.languages[0]*/lng.key, r.updKey.namespace, r.updKey.key),
                        reviewStatus: "NOT_REVIEWED"
                    })
                })
        });

        // console.log(`[SimpleLocalize] Pushing updated translations: ${reqs.length}`, requestBodyTranslations);

        const resp: Response = await fetch(SimplelocalizeBackendApiClient.endpointUpdateKeys, {
            method: 'PATCH',
            mode: 'cors',
            headers: {
                'Content-Type': 'application/json',
                'X-SimpleLocalize-Token': apiKey
            },
            body: JSON.stringify(requestBodyTranslations),
        })
        const json = await resp.json();
        console.log("updated translations", requestBodyTranslations, JSON.stringify(json));

    }

    private static async deleteKeys(reqs: UpdatedKey[]): Promise<void> {
        const requestBodyKeys: {
            translationKeys: { key: string, namespace: string }[],
        } = {
            translationKeys: []
        }

        reqs.forEach(kk => {
            console.log("deleting translation key ", kk.namespace, kk.key)
            requestBodyKeys.translationKeys.push({
                namespace: kk.namespace,
                key: kk.key,
            })
        })


        // console.log(`[SimpleLocalize] Pushing updated translations: ${reqs.length}`, requestBodyTranslations);

        const resp: Response = await fetch(SimplelocalizeBackendApiClient.endpointUploadKeys, {
            method: 'DELETE',
            mode: 'cors',
            headers: {
                'Content-Type': 'application/json',
                'X-SimpleLocalize-Token': apiKey
            },
            body: JSON.stringify(requestBodyKeys),
        });
        const json  = await resp.json();
        console.log("deleted keys", requestBodyKeys, JSON.stringify(json));

    }

    private static flatReqsChunked(reqsAsMap: Dictionary<UpdatedKey, string>, chunkSize: number): UpdatingValue[][] {
        const flatReqs: UpdatingValue[] = [];
        reqsAsMap.entries().forEach((v) => {
            flatReqs.push({updKey: {language: v[0].language, namespace: v[0].namespace, key: v[0].key}, text: v[1]});
        })

        console.log(flatReqs[0])

        const chunks: UpdatingValue[][] = []
        for (let i = 0; i < flatReqs.length; i += chunkSize) {
            chunks.push(flatReqs.slice(i, i + chunkSize));
        }

        return chunks;
    }

}