import {LanguageDefImpl} from "../language-def-impl";
import {
    AllLanguagesAllNamespacesTranslationResource, delay,
    I18nStore,
    MissingKeyHandler,
    TranslationResourceLoader,
    UpdatedKey
} from "../i18n-store";
import {Dictionary} from "../dictionary";

const runsOnServerSide = typeof window === 'undefined'

if (!runsOnServerSide) {
    throw new Error("this config is intended on server side only")
    // console.log(new Error("this config is intended on server side only"))
}



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


/*
 * the strategy to undertake when there is a difference between the value provided in the content block, and the value
 * recorded as the value of the fallback language.
 *
 * That the fallback language is by definition the language in which the content is written. Hence, for a given translation key,
 * it is the value provided by the content, takes precedence.
 *
 * For the translation key, the translation corresponding to the fallback language should always be equal to the value
 * provided by the content for the same translation key.
 *
 * Consequently, it may so happen that this equivalence doesn't hold anymore, when the content changes for a given
 * translation key (markdown file content modified, for example).
 *
 * If such situation is detected, we should update the value of translation for the fallback language for the
 * translation key concerned.
 *
 * When the translation value is updated, the corresponding translation on other languages may not correspond anymore
 * to this new value.
 *
 * And in this case several strategies are possible:
 *
 * - update_fallback_lng_only:
 *      update the value of the translation for fallback language, and stop there, don't do anything else
 *
 * - delete_translations:
 *      * update the value of the translation for fallback language
 *      * delete translations (if present) for other languages, thus indicating that the new translations should be provided
 *
 * - reset_reviewed_status:
 *      * update the value of the translation for fallback language
 *      * remove the REVIEWED flag from the translations for other languages
 *
 * Which strategy to use is up to the user of the library to choose.
 * By default, strategy 'reset_reviewed_status' is used
 */
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
        const resp = await fetch(`${loadPathBase}/_languages`, /*{cache: "force-cache"}*/);
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

        // console.log("received missing key: ", lngs, ns, key, fallbackValue/*, I18nStore.getI18nByLangByNs('ru')?.store.data*/);

        lngs.forEach((lng) => {

            const missingKey: UpdatedKey = {language: lng, namespace: ns, key: key};
            /*
             * by checking the presence of the key we ensure that only the first update will be taken into account
             * here we rely on the fact that the fallback lng translation is queried first
             * see I18nStore.i18nForNodokuImpl for details, when i18n.getFixedT is called prior to i18n.t
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

    private static async loadTranslationsUsingCdn(allLng: readonly string[], allNs: readonly string[]): Promise<AllLanguagesAllNamespacesTranslationResource> {

        const res: AllLanguagesAllNamespacesTranslationResource = {};

        await Promise.all(allLng.map(async (language: string): Promise<void> => {
            await Promise.all(allNs.map(async (ns: string): Promise<void> => {
                console.log("querying the language on CDN", language, " on namespace ", ns, "url", `${loadPathBase}/${language}/${ns}`);
                const resp = await fetch(`${loadPathBase}/${language}/${ns}`);
                const reply = await resp.json();
                console.log("this is reply", language, ns, reply);
                return reply;
            }))
        }))

        return res;
    }

    private static async loadTranslationsUsingApi(allLng: readonly string[], allNs: readonly string[]): Promise<AllLanguagesAllNamespacesTranslationResource> {
        console.log("querying the language on API ", allLng.join(", "), " on namespace ", allNs, "url", `${loadTranslationsApiBase}`);
        let finished = false;
        let page = 0;
        const translatedReply: AllLanguagesAllNamespacesTranslationResource = {};
        while (!finished) {
            const resp = fetch(`${loadTranslationsApiBase}?page=${page}`, {
                method: 'GET',
                mode: 'cors',
                headers: {
                    'Content-Type': 'application/json',
                    'X-SimpleLocalize-Token': apiKey
                },
                // cache: 'force-cache'
            })
                .then(resp => resp.json())
                .catch(reason => {console.log("can't download translations: ", reason)});

            const reply = await resp;
            if (reply.status != 200) {
                throw new Error("can't retrieve translations: " + reply);
            }

            console.log("received data page ", page, reply.msg)

            reply.data.forEach((t: any) => {
                const key = t.key;
                const namespace = t.namespace;
                const language = t.language;
                const text = t.text;

                if (!translatedReply.hasOwnProperty(language)) {
                    translatedReply[language] = {};
                }
                if (!translatedReply[language].hasOwnProperty(namespace)) {
                    translatedReply[language][namespace] = {}
                }
                translatedReply[language][namespace][key] = text;
                // if (language === "it") {
                //     console.log("translatedReply[language][namespace][key] = text", language, namespace, key, text)
                // }
            });

            page++;
            finished = reply.data.length == 0;
            delay(200)
        }

        allLng.forEach(lng => {
            if (!translatedReply.hasOwnProperty(lng)) {
                translatedReply[lng] = {};
            }
            allNs.forEach(ns => {
                if (!translatedReply[lng].hasOwnProperty(ns)) {
                    translatedReply[lng][ns] = {};
                }
            })
        })

        // console.log("_______translatedReply_______", allLng, allNs, translatedReply)
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

        if (shoulReload) {
            await I18nStore.reloadResources();
            console.log("resources reloaded...")
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

        const allLanguages: LanguageDefImpl[] = await SimplelocalizeBackendApiClient.allLanguagesImpl();

        reqs.forEach(r => {

            allLanguages
                .forEach(lng => {

                    requestBodyTranslations.translations.push({
                        language: lng.key,
                        namespace: r.updKey.namespace,
                        key: r.updKey.key,
                        text: I18nStore.translate(lng.key, r.updKey.namespace, r.updKey.key),
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
        // console.log("updated translations", requestBodyTranslations, JSON.stringify(json));

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