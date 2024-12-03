import {Resource} from "i18next";
import {LanguageDefImpl} from "../../util/language-def-impl.js";
import {delay} from "../../store/abstract-i18n-store";
import {UpdatedKey, UpdatingValue} from "../../util/dictionary.js";
import {TranslationBackendClient} from "../../backend/translation-backend-client.js";

const runsOnServerSide = typeof window === 'undefined'

if (!runsOnServerSide) {
    throw new Error("this config is intended on server side only")
}


const loadTranslationsApiBase = "https://api.simplelocalize.io/api/v2/translations";



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

export enum OnMissingKeyStrategyImpl {
    upload, save_to_file
}


export class SimplelocalizeBackendApiClient extends TranslationBackendClient {

    private static cdnBaseUrl = "https://cdn.simplelocalize.io";
    private static endpointUpdateKeys = "https://api.simplelocalize.io/api/v2/translations/bulk"
    private static endpointUploadKeys = "https://api.simplelocalize.io/api/v1/translation-keys/bulk"

    private apiKey: string;
    private projectToken: string;
    private cdnLoadPathBase: string;
    private translationFetchMode: "cdn" | "api";


    constructor(apiKey: string,
                projectToken: string,
                translationFetchMode: "cdn" | "api") {

        super();

        this.projectToken = projectToken;
        this.apiKey = apiKey;
        this.translationFetchMode = translationFetchMode;
        const environment = "_latest"; // or "_production"
        this.cdnLoadPathBase = `${SimplelocalizeBackendApiClient.cdnBaseUrl}/${this.projectToken}/${environment}`;
    }




    async allLanguages(): Promise<LanguageDefImpl[]> {
        const resp = await fetch(`${this.cdnLoadPathBase}/_languages`, /*{cache: "force-cache"}*/);
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


    public override translationToResource(allLng: readonly string[], allNs: readonly string[]): Promise</*AllLanguagesAllNamespacesTranslationResource*/Resource> {
        switch (this.translationFetchMode) {
            case "api":
                return SimplelocalizeBackendApiClient.loadTranslationsUsingApi(this, allLng, allNs);
            case "cdn":
                return SimplelocalizeBackendApiClient.loadTranslationsUsingCdn(this, allLng, allNs);
        }

    }

    public static async loadTranslationsUsingCdn(client: SimplelocalizeBackendApiClient, allLng: readonly string[], allNs: readonly string[]): Promise<Resource> {

        const res: Resource = {};

        await Promise.all(allLng.map(async (language: string): Promise<void> => {
            if (!res.hasOwnProperty(language)) {
                res[language] = {};
            }
            await Promise.all(allNs.map(async (ns: string): Promise<void> => {
                if (!res[language].hasOwnProperty(ns)) {
                    res[language][ns] = {}
                }
                console.log("querying the language on CDN", language, " on namespace ", ns, "url", `${client.cdnLoadPathBase}/${language}/${ns}`);
                const resp = await fetch(`${client.cdnLoadPathBase}/${language}/${ns}`);
                const reply = await resp.json();
                // console.log("this is reply", language, ns, reply);
                res[language][ns] = reply;
            }))
        }))

        // console.log("_______translatedReply_______", allLng, allNs, res)
        return res;
    }

    public static async loadTranslationsUsingApi(client: SimplelocalizeBackendApiClient, allLng: readonly string[], allNs: readonly string[]): Promise<Resource> {

        console.log("querying the language on API ", allLng.join(", "), " on namespace ", allNs, "url", `${loadTranslationsApiBase}`);
        // console.log("printing callstack", new Error("loadTranslationsUsingApi"))
        let finished = false;
        let page = 0;
        const translatedReply: Resource = {};
        let retries: number = 10;
        // console.log("in simplelocalize backend client ", this)
        const apiKey = client.apiKey;
        while (!finished && retries >= 0) {
            const resp: Response = await fetch(`${loadTranslationsApiBase}?page=${page}`, {
                method: 'GET',
                mode: 'cors',
                headers: {
                    'Content-Type': 'application/json',
                    'X-SimpleLocalize-Token': apiKey
                },
                // cache: 'force-cache'
            })
                // .then(resp => resp.json())
                .catch(reason => {throw new Error("can't download translations: ", reason)});

            if (!resp || resp.status != 200) {
                throw new Error("can't retrieve translations: " + (await resp?.text()));
            }

            const text = await (resp.text());
            let reply = undefined;
            if (text.indexOf("Too Many Requests") >= 0) {
                // retry
                console.log("too many requests, waiting and retrying...");
                await delay(1000)
            } else {
                reply = JSON.parse(text);
            }

            if (!reply) {
                --retries;
            } else {
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
                    const l = translatedReply[language][namespace] as {[key: string]: string};
                    l[key] = text;
                });

                page++;
                finished = reply.data.length == 0;
                delay(200)

            }


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

    public override async pushKeys(reqs: UpdatedKey[]): Promise<void> {
        const requestBodyKeys = {
            translationKeys: reqs.map((r: UpdatedKey) => {return {key: r.key, namespace: r.namespace}})
        }
        const resp = await fetch(SimplelocalizeBackendApiClient.endpointUploadKeys, {
            method: 'POST',
            mode: 'cors',
            headers: {
                'Content-Type': 'application/json',
                'X-SimpleLocalize-Token': this.apiKey
            },
            body: JSON.stringify(requestBodyKeys),
        });
        const json = await resp.json();
        console.log("pushed keys", requestBodyKeys, JSON.stringify(json))

    }

    public override async updateTranslations(reqs: UpdatingValue[]): Promise<void> {
        const requestBodyTranslations = {
            translations: reqs.map(r => {return {...r.updKey, text: r.text, reviewStatus: "REVIEWED"}})
        }

        // console.log(`[SimpleLocalize] Pushing updated translations: ${reqs.length}`, requestBodyTranslations);

        const resp: Response = await fetch(SimplelocalizeBackendApiClient.endpointUpdateKeys, {
            method: 'PATCH',
            mode: 'cors',
            headers: {
                'Content-Type': 'application/json',
                'X-SimpleLocalize-Token': this.apiKey
            },
            body: JSON.stringify(requestBodyTranslations),
        })
        const json = await resp.json();
        console.log("updated translations", requestBodyTranslations, JSON.stringify(json));

    }

    public override async removeReviewedStatus(reqs: UpdatingValue[]): Promise<void> {


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

        const allLanguages: LanguageDefImpl[] = await this.allLanguages();

        reqs.forEach(r => {

            allLanguages
                .forEach(lng => {

                    requestBodyTranslations.translations.push({
                        language: lng.key,
                        namespace: r.updKey.namespace,
                        key: r.updKey.key,
                        text: r.text, //this.i18nStore.translate(lng.key, r.updKey.namespace, r.updKey.key),
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
                'X-SimpleLocalize-Token': this.apiKey
            },
            body: JSON.stringify(requestBodyTranslations),
        })
        const json = await resp.json();
        // console.log("updated translations", requestBodyTranslations, JSON.stringify(json));

    }

    public async deleteKeys(reqs: UpdatedKey[]): Promise<void> {
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
                'X-SimpleLocalize-Token': this.apiKey
            },
            body: JSON.stringify(requestBodyKeys),
        });
        const json  = await resp.json();
        console.log("deleted keys", requestBodyKeys, JSON.stringify(json));

    }

}