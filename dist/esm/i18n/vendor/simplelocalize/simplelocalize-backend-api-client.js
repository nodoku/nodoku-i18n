import { TranslationBackendClient } from "../../backend/translation-backend-client.js";
import { delay } from "../../../index";
const runsOnServerSide = typeof window === 'undefined';
if (!runsOnServerSide) {
    throw new Error("this config is intended on server side only");
}
const loadTranslationsApiBase = "https://api.simplelocalize.io/api/v2/translations";
export class SimplelocalizeBackendApiClientImpl extends TranslationBackendClient {
    constructor(apiKey, projectToken, translationFetchMode) {
        super();
        this.projectToken = projectToken;
        this.apiKey = apiKey;
        this.translationFetchMode = translationFetchMode;
        const environment = "_latest"; // or "_production"
        this.cdnLoadPathBase = `${SimplelocalizeBackendApiClientImpl.cdnBaseUrl}/${this.projectToken}/${environment}`;
    }
    async allLanguages() {
        const resp = await fetch(`${this.cdnLoadPathBase}/_languages`);
        if (!resp.ok) {
            throw new Error("can't load languages: " + resp.status + ", " + (await resp.text()));
        }
        return (await resp.json()).map((l) => {
            if (!l.icon) {
                l.icon = l.key;
            }
            if (l.key == 'en') {
                l.icon = 'gb';
            }
            return l;
        });
    }
    translationToResource(allLng, allNs) {
        switch (this.translationFetchMode) {
            case "api":
                return SimplelocalizeBackendApiClientImpl.loadTranslationsUsingApi(this, allLng, allNs);
            case "cdn":
                return SimplelocalizeBackendApiClientImpl.loadTranslationsUsingCdn(this, allLng, allNs);
        }
    }
    static async loadTranslationsUsingCdn(client, allLng, allNs) {
        const res = {};
        await Promise.all(allLng.map(async (language) => {
            if (!res.hasOwnProperty(language)) {
                res[language] = {};
            }
            await Promise.all(allNs.map(async (ns) => {
                if (!res[language].hasOwnProperty(ns)) {
                    res[language][ns] = {};
                }
                console.log("querying the language on CDN", language, " on namespace ", ns, "url", `${client.cdnLoadPathBase}/${language}/${ns}`);
                const resp = await fetch(`${client.cdnLoadPathBase}/${language}/${ns}`);
                const reply = await resp.json();
                // console.log("this is reply", language, ns, reply);
                res[language][ns] = reply;
            }));
        }));
        // console.log("_______translatedReply_______", allLng, allNs, res)
        return res;
    }
    static async loadTranslationsUsingApi(client, allLng, allNs) {
        console.log("querying the language on API ", allLng.join(", "), " on namespace ", allNs, "url", `${loadTranslationsApiBase}`);
        // console.log("printing callstack", new Error("loadTranslationsUsingApi"))
        let finished = false;
        let page = 0;
        const translatedReply = {};
        let retries = 10;
        // console.log("in simplelocalize backend client ", this)
        const apiKey = client.apiKey;
        while (!finished && retries >= 0) {
            const resp = await fetch(`${loadTranslationsApiBase}?page=${page}`, {
                method: 'GET',
                mode: 'cors',
                headers: {
                    'Content-Type': 'application/json',
                    'X-SimpleLocalize-Token': apiKey
                },
                // cache: 'force-cache'
            })
                // .then(resp => resp.json())
                .catch(reason => { throw new Error("can't download translations: ", reason); });
            if (!resp || resp.status != 200) {
                throw new Error("can't retrieve translations: " + (await (resp === null || resp === void 0 ? void 0 : resp.text())));
            }
            const text = await (resp.text());
            let reply = undefined;
            if (text.indexOf("Too Many Requests") >= 0) {
                // retry
                console.log("too many requests, waiting and retrying...");
                await delay(1000);
            }
            else {
                reply = JSON.parse(text);
            }
            if (!reply) {
                --retries;
            }
            else {
                console.log("received data page ", page, reply.msg);
                reply.data.forEach((t) => {
                    const key = t.key;
                    const namespace = t.namespace;
                    const language = t.language;
                    const text = t.text;
                    if (!translatedReply.hasOwnProperty(language)) {
                        translatedReply[language] = {};
                    }
                    if (!translatedReply[language].hasOwnProperty(namespace)) {
                        translatedReply[language][namespace] = {};
                    }
                    const l = translatedReply[language][namespace];
                    l[key] = text;
                });
                page++;
                finished = reply.data.length == 0;
                delay(200);
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
            });
        });
        // console.log("_______translatedReply_______", allLng, allNs, translatedReply)
        return translatedReply;
    }
    async pushKeys(reqs) {
        const requestBodyKeys = {
            translationKeys: reqs.map((r) => { return { key: r.key, namespace: r.namespace }; })
        };
        const resp = await fetch(SimplelocalizeBackendApiClientImpl.endpointUploadKeys, {
            method: 'POST',
            mode: 'cors',
            headers: {
                'Content-Type': 'application/json',
                'X-SimpleLocalize-Token': this.apiKey
            },
            body: JSON.stringify(requestBodyKeys),
        });
        const json = await resp.json();
        console.log("pushed keys", requestBodyKeys, JSON.stringify(json));
    }
    async updateTranslations(reqs) {
        const requestBodyTranslations = {
            translations: reqs.map(r => { return Object.assign(Object.assign({}, r.updKey), { text: r.text, reviewStatus: "REVIEWED" }); })
        };
        // console.log(`[SimpleLocalize] Pushing updated translations: ${reqs.length}`, requestBodyTranslations);
        const resp = await fetch(SimplelocalizeBackendApiClientImpl.endpointUpdateKeys, {
            method: 'PATCH',
            mode: 'cors',
            headers: {
                'Content-Type': 'application/json',
                'X-SimpleLocalize-Token': this.apiKey
            },
            body: JSON.stringify(requestBodyTranslations),
        });
        const json = await resp.json();
        console.log("updated translations", requestBodyTranslations, JSON.stringify(json));
    }
    async removeReviewedStatus(reqs) {
        const requestBodyTranslations = {
            translations: []
        };
        const allLanguages = await this.allLanguages();
        reqs.forEach(r => {
            allLanguages
                .forEach(lng => {
                requestBodyTranslations.translations.push({
                    language: lng.key,
                    namespace: r.updKey.namespace,
                    key: r.updKey.key,
                    text: r.text, //this.i18nStore.translate(lng.key, r.updKey.namespace, r.updKey.key),
                    reviewStatus: "NOT_REVIEWED"
                });
            });
        });
        // console.log(`[SimpleLocalize] Pushing updated translations: ${reqs.length}`, requestBodyTranslations);
        const resp = await fetch(SimplelocalizeBackendApiClientImpl.endpointUpdateKeys, {
            method: 'PATCH',
            mode: 'cors',
            headers: {
                'Content-Type': 'application/json',
                'X-SimpleLocalize-Token': this.apiKey
            },
            body: JSON.stringify(requestBodyTranslations),
        });
        const json = await resp.json();
        // console.log("updated translations", requestBodyTranslations, JSON.stringify(json));
    }
    async deleteKeys(reqs) {
        const requestBodyKeys = {
            translationKeys: []
        };
        reqs.forEach(kk => {
            console.log("deleting translation key ", kk.namespace, kk.key);
            requestBodyKeys.translationKeys.push({
                namespace: kk.namespace,
                key: kk.key,
            });
        });
        // console.log(`[SimpleLocalize] Pushing updated translations: ${reqs.length}`, requestBodyTranslations);
        const resp = await fetch(SimplelocalizeBackendApiClientImpl.endpointUploadKeys, {
            method: 'DELETE',
            mode: 'cors',
            headers: {
                'Content-Type': 'application/json',
                'X-SimpleLocalize-Token': this.apiKey
            },
            body: JSON.stringify(requestBodyKeys),
        });
        const json = await resp.json();
        console.log("deleted keys", requestBodyKeys, JSON.stringify(json));
    }
}
SimplelocalizeBackendApiClientImpl.cdnBaseUrl = "https://cdn.simplelocalize.io";
SimplelocalizeBackendApiClientImpl.endpointUpdateKeys = "https://api.simplelocalize.io/api/v2/translations/bulk";
SimplelocalizeBackendApiClientImpl.endpointUploadKeys = "https://api.simplelocalize.io/api/v1/translation-keys/bulk";
