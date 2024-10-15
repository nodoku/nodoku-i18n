import {createInstance, i18n} from 'i18next'
import resourcesToBackend from 'i18next-resources-to-backend'
import {apiKey, getOptions, onFallbackLanguageValueChange} from './settings'
import LanguageDefImpl from "../language-def-impl";
import {NdTranslatedText} from "nodoku-core";
import {load} from "js-yaml";


export const projectToken = process.env.SIMPLELOCALIZE_PROJECT_TOKEN;
export const cdnBaseUrl = "https://cdn.simplelocalize.io";
export const environment = "_latest"; // or "_production"

export const loadPathBase = `${cdnBaseUrl}/${projectToken}/${environment}`;

const loadTranslationsApiBase = "https://api.simplelocalize.io/api/v2/translations";

const runsOnServerSide = typeof window === 'undefined'

if (!runsOnServerSide) {
    throw new Error("this config is intended on server side only")
}


const translationToResource = async (language: string, ns: string): Promise<{[key: string]: string}> => {
    // console.log("querying the language ", language, " on namespace ", ns, "url", `${loadPathBase}/${language}/${ns}`);
    console.log("querying the language ", language, " on namespace ", ns, "url", `${loadTranslationsApiBase}?namespace=${ns}&language=${language}`);
    // const resp = await fetch(`${loadPathBase}/${language}/${ns}`);
    const resp = await fetch(`${loadTranslationsApiBase}?namespace=${ns}&language=${language}`, {
        method: 'GET',
        mode: 'cors',
        headers: {
            'Content-Type': 'application/json',
            'X-SimpleLocalize-Token': apiKey
        },
        cache: 'no-cache'
    })
    const reply = await resp.json();
    // console.log("this is reply", language, ns, reply);
    // return reply;
    // const translatedReply = reply.data.map((t: any) => {const p = new LooseObject(); p[t.key] = t.text; return p; });
    const translatedReply: {[key: string]: string} = {};
    reply.data
        .filter((t: any) => t.text && t.text.length > 0)
        .forEach((t: any) => {
            // const p: {[key: string]: string} = {} as {[key: string]: string};
            translatedReply[t.key] = t.text;
            // return p;
        });
    console.log("translatedReply", language, ns, translatedReply)
    return translatedReply;

}

interface LooseObject {
    [key: string]: any
}

export const allLanguagesImpl = async (): Promise<LanguageDefImpl[]> => {
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

const i18nByLangByNs: Map<string, Map<string, i18n>> = new Map();

export function getI18nByLangByNs(): Map<string, Map<string, i18n>> {
    return i18nByLangByNs;
}

const initI18next = async (lng: string, ns: string, fallbackLng: string): Promise<i18n> => {
    const i18nInstance = createInstance()
    await i18nInstance
        .use(resourcesToBackend(translationToResource))
        .init(getOptions(lng, ns, fallbackLng/*, (await allLanguagesImpl()).map(l => l.key)*/))
    return i18nInstance
}

async function loadNamespacesForLanguage(lng: string, nampespaces: string[], fallbackLng: string): Promise<{lng: string, ns: string, i18n: i18n}[]> {
    return await Promise.all(
        nampespaces.map(async ns => {
            // const i18n = await initI18next(lng, ns, fallbackLng);
            // // console.log("created lng ns", lng, ns, JSON.stringify(i18n))
            // return {lng: lng, ns: ns, i18n: i18n};
            let i18n = i18nByLangByNs.get(lng)?.get(ns)
            if (!i18n) {
                i18n = await initI18next(lng, ns, fallbackLng);
                // console.log("created lng ns", lng, ns, JSON.stringify(i18n))
            }
            i18n.store.data = {}
            await i18n.reloadResources(/*[lng, fallbackLng], ns*/)
            return {lng: lng, ns: ns, i18n: i18n};
        })
    );

}


export async function loadAllLangsAndNamespacesImpl(lng: string, nampespaces: string[], fallbackLng: string): Promise<void> {
    // const k1: {lng: string, ns: string, i18n: i18n}[] = await Promise.all(
    //     nampespaces.map(async ns => {
    //         const i18n = await initI18next(lng, ns, fallbackLng);
    //         // console.log("created lng ns", lng, ns, JSON.stringify(i18n))
    //         return {lng: lng, ns: ns, i18n: i18n};
    //     })
    // );
    // const k2: {lng: string, ns: string, i18n: i18n}[] = (await Promise.all(
    //     nampespaces
    //         .map(async ns => {
    //             if (!i18nByLangByNs.get(fallbackLng)?.get(ns)) {
    //                 const i18n = await initI18next(fallbackLng, ns, fallbackLng);
    //                 console.log("created lng ns", lng, ns, JSON.stringify(i18n))
    //                 return {lng: fallbackLng, ns: ns, i18n: i18n};
    //             } else {
    //                 return undefined;
    //             }
    //         })
    // ))
    //     .filter(nsLoaded => nsLoaded != undefined)
    //     .map(nsLoaded => nsLoaded as { lng: string, ns: string, i18n: i18n })

    const k1: {lng: string, ns: string, i18n: i18n}[] = await loadNamespacesForLanguage(lng, nampespaces, fallbackLng);
    // const k2: {lng: string, ns: string, i18n: i18n}[] = await loadNamespacesForLanguage(fallbackLng, nampespaces, fallbackLng);

    const k = k1.concat(/*k2*/[])

    console.log("this is k concatenated ", k.map(l => {return {lng: l.lng, ns: l.ns}}))
    k.forEach((i: {lng: string, ns: string, i18n: i18n}) => {
        const {lng, ns, i18n} = i;
        if (!i18nByLangByNs.get(lng)) {
            i18nByLangByNs.set(lng, new Map())
        }
        i18nByLangByNs.get(lng)!.set(ns, i18n)
    })

    console.log("loaded namespaces", nampespaces)

}

export async function i18nForNodokuImpl(lng: string): Promise<{t: (text: NdTranslatedText) => string}> {

    return {
        t: (text: NdTranslatedText) => {
            const i18n = i18nByLangByNs.get(lng)?.get(text.ns);
            if (i18n) {

                const fallbackLng: string = Array.isArray(i18n.options.fallbackLng) ? i18n.options.fallbackLng[0] : i18n.options.fallbackLng;

                // const fallbackI18n = i18nByLangByNs.get(fallbackLng)?.get(text.ns);
                // if (fallbackI18n) {
                //     console.log("setting default text for ", fallbackLng, text.text)
                //     fallbackI18n.t(text.key, text.text.trim())
                // }

                /*
                 * make sure the fallback lng translation is intercepted by the missing key handler and eventually written to backend
                 */
                const existing: string = i18n.getFixedT(fallbackLng)(text.key, text.text.trim())
                if (existing !== text.text.trim()) {
                    console.log("detected translation change: ", existing, text.text.trim())
                    onFallbackLanguageValueChange(fallbackLng, text.ns, text.key, text.text.trim())
                }

                const details = i18n.t(text.key, {returnDetails: true})
                console.log(">>>>>>>.... details", details)
                return details.usedLng === lng ? details.res : `<small style="font-size: 12px">n/a ${lng}:${text.ns}:${text.key}</small>[${details.res}]`;
            } else {
                return `${lng}.{${text.ns}:${text.key}}`
            }
        }
    }

}
