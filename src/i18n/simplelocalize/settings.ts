
// const endpoint = `https://api.simplelocalize.io/api/v1/translations`;
import {allLanguagesImpl, getI18nByLangByNs} from "./server-i18n-conf";
import {i18n} from "i18next";

const endpointUpdateKeys = "https://api.simplelocalize.io/api/v2/translations/bulk"
const endpointUploadKeys = "https://api.simplelocalize.io/api/v1/translation-keys/bulk"

const missingKeysRequests: Map<string, Map<string, {lng: string, text: string}>> = new Map();

export const apiKey: string = process.env.SIMPLELOCALIZE_API_KEY ? process.env.SIMPLELOCALIZE_API_KEY : "n-a";

type KK = {language: string, namespace: string, key: string, text: string}

const fallbackLanguageValuesToBeUpdated: KK[] = [];

export function onFallbackLanguageValueChange(language: string, namespace: string, key: string, text: string): void {

    fallbackLanguageValuesToBeUpdated.push({language, namespace, key, text})

}

function missingKeyHandler(languages: readonly string[],
                           namespace: string,
                           key: string,
                           fallbackValue: string) {
    console.log("received missing key: ", namespace, key, languages, fallbackValue)

    languages.forEach((l) => {

        if (!missingKeysRequests.has(namespace)) {
            missingKeysRequests.set(namespace, new Map());
        }
        if (!missingKeysRequests.get(namespace)!.has(key)) {
            /*
             * here we rely on the fact that the fallback lng translation is queried first
             * see i18nForNodokuImpl for details, when i18n.getFixedT is called prior to i18n.t
             */
            missingKeysRequests.get(namespace)!.set(key, {lng: l, text: fallbackValue});
        }
    })

    // const flatReqs: {key: string, language: string, text: string, namespace: string}[] = []
    // missingKeysRequests.forEach((v, ns) => {
    //     v.forEach((l, key) => {
    //         flatReqs.push({key: key, namespace: ns, text: l.text, language: l.lng});
    //     })
    // })
    // console.log("updated missing keys: ", flatReqs)

}

async function pushKeys(reqs: KK[]): Promise<void> {
    const requestBodyKeys = {
        translationKeys: reqs.map(r => {return {key: r.key, namespace: r.namespace}})
    }
    const resp = await fetch(endpointUploadKeys, {
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

async function updateTranslations(reqs: KK[]): Promise<void> {
    const requestBodyTranslations = {
        translations: reqs
    }

    // console.log(`[SimpleLocalize] Pushing updated translations: ${reqs.length}`, requestBodyTranslations);

    const resp: Response = await fetch(endpointUpdateKeys, {
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

async function deleteKeys(reqs: KK[]): Promise<void> {
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

    const resp: Response = await fetch(endpointUploadKeys, {
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

const pushMissingKeys = () => {
    // console.log(`[SimpleLocalize] Checking for missing keys: ${missingKeysRequests.length}`);

    const shoulReload = missingKeysRequests.size > 0 || fallbackLanguageValuesToBeUpdated.length > 0;

    if (missingKeysRequests.size > 0) {

        const flatReqs: KK[] = []
        missingKeysRequests.forEach((v, ns) => {
            v.forEach((l, key) => {
                flatReqs.push({key: key, namespace: ns, text: l.text, language: l.lng});
            })
        })

        const chunkSize = 100;
        const chunks: KK[][] = []
        for (let i = 0; i < flatReqs.length; i += chunkSize) {
            chunks.push(flatReqs.slice(i, i + chunkSize));
        }

        chunks.forEach(async (reqs: KK[]) => {
            // console.log(`[SimpleLocalize] Pushing missing keys: ${reqs.length}`, reqs);
            // const requestBodyKeys = {
            //     translationKeys: reqs.map(r => {return {key: r.key, namespace: r.namespace}})
            // }
            // await fetch(endpointUploadKeys, {
            //     method: 'POST',
            //     mode: 'cors',
            //     headers: {
            //         'Content-Type': 'application/json',
            //         'X-SimpleLocalize-Token': apiKey
            //     },
            //     body: JSON.stringify(requestBodyKeys),
            // })
            //     .then(resp => resp.json())
            //     .then(json => console.log("pushed missing keys", requestBodyKeys, JSON.stringify(json)))

            await pushKeys(reqs)

            // const requestBodyTranslations = {
            //     translations: reqs
            // }
            //
            // // console.log(`[SimpleLocalize] Pushing updated translations: ${reqs.length}`, requestBodyTranslations);
            //
            // await fetch(endpointUpdateKeys, {
            //     method: 'PATCH',
            //     mode: 'cors',
            //     headers: {
            //         'Content-Type': 'application/json',
            //         'X-SimpleLocalize-Token': apiKey
            //     },
            //     body: JSON.stringify(requestBodyTranslations),
            // })
            //     .then(resp => resp.json())
            //     .then(json => console.log("updated translations", requestBodyTranslations, JSON.stringify(json)))

            await updateTranslations(reqs)

            reqs.forEach((v: {key: string, language: string, text: string, namespace: string}) => {
                if (missingKeysRequests.get(v.namespace)) {
                    missingKeysRequests.get(v.namespace)!.delete(v.key)
                }
                if (missingKeysRequests.get(v.namespace) && missingKeysRequests.get(v.namespace)!.size == 0) {
                    missingKeysRequests.delete(v.namespace)
                }

            })

            // reqs.forEach((v: KK) => {
            //
            //     // const i18n = getI18nByLangByNs().get(v.language)?.get(v.namespace)
            //     // if (i18n) {
            //     //     i18n.loadResources();
            //     // }
            // })
        })

    }

    if (fallbackLanguageValuesToBeUpdated.length > 0) {
        const chunkSize = 100;
        const chunks: KK[][] = []
        for (let i = 0; i < fallbackLanguageValuesToBeUpdated.length; i += chunkSize) {
            chunks.push(fallbackLanguageValuesToBeUpdated.slice(i, i + chunkSize));
        }

        chunks.forEach(async (reqs: KK[]) => {
            // console.log(`[SimpleLocalize] Pushing missing keys: ${reqs.length}`, reqs);


            // const requestBodyTranslations = {
            //     translations: reqs.slice()
            // }

            // const requestBodyKeys: {
            //     translationKeys: { key: string, namespace: string }[],
            // } = {
            //     translationKeys: []
            // }
            //
            // reqs.forEach(kk => {
            //     console.log("deleting translation key ", kk.namespace, kk.key)
            //     requestBodyKeys.translationKeys.push({
            //         namespace: kk.namespace,
            //         key: kk.key,
            //     })
            // })
            //
            //
            // // console.log(`[SimpleLocalize] Pushing updated translations: ${reqs.length}`, requestBodyTranslations);
            //
            // await fetch(endpointUploadKeys, {
            //     method: 'DELETE',
            //     mode: 'cors',
            //     headers: {
            //         'Content-Type': 'application/json',
            //         'X-SimpleLocalize-Token': apiKey
            //     },
            //     body: JSON.stringify(requestBodyKeys),
            // })
            //     .then(resp => resp.json())
            //     .then(json => console.log("deleted translations", requestBodyKeys, JSON.stringify(json)))

            await deleteKeys(reqs)

            console.log("updated")


            // const requestBodyKeys2 = {
            //     translationKeys: reqs.map(r => {return {key: r.key, namespace: r.namespace}})
            // }
            // await fetch(endpointUploadKeys, {
            //     method: 'POST',
            //     mode: 'cors',
            //     headers: {
            //         'Content-Type': 'application/json',
            //         'X-SimpleLocalize-Token': apiKey
            //     },
            //     body: JSON.stringify(requestBodyKeys),
            // })
            //     .then(resp => resp.json())
            //     .then(json => console.log("added replacing keys", requestBodyKeys, JSON.stringify(json)))

            await pushKeys(reqs)

            // const requestBodyTranslations = {
            //     translations: reqs
            // }
            //
            // // console.log(`[SimpleLocalize] Pushing updated translations: ${reqs.length}`, requestBodyTranslations);
            //
            // await fetch(endpointUpdateKeys, {
            //     method: 'PATCH',
            //     mode: 'cors',
            //     headers: {
            //         'Content-Type': 'application/json',
            //         'X-SimpleLocalize-Token': apiKey
            //     },
            //     body: JSON.stringify(requestBodyTranslations),
            // })
            //     .then(resp => resp.json())
            //     .then(json => console.log("updated value of replaced keys", requestBodyTranslations, JSON.stringify(json)))

            await updateTranslations(reqs)

            // reqs.forEach((v: KK) => {
            //
            //     // const i18n = getI18nByLangByNs().get(v.language)?.get(v.namespace)
            //     // console.log("loading resources for ", v.language, v.namespace, i18n != undefined, getI18nByLangByNs().get(v.language) != undefined)
            //     // if (i18n) {
            //     //     i18n.loadResources();
            //     // }
            //     getI18nByLangByNs().forEach(lng => {
            //         lng.forEach((nsi18n: i18n) => {
            //             console.log("loading resources for ", v.language, v.namespace)
            //             nsi18n.loadResources()
            //         })
            //     })
            // })

        })

        fallbackLanguageValuesToBeUpdated.length = 0;


    }

    if (shoulReload) {
        setTimeout(() => {
            getI18nByLangByNs().forEach((lngNsI18n, lng) => {
                lngNsI18n.forEach((nsi18n: i18n, ns) => {
                    // nsi18n.loadResources()
                    const fallbackLng: string = Array.isArray(nsi18n.options.fallbackLng) ? nsi18n.options.fallbackLng[0] : nsi18n.options.fallbackLng;
                    console.log("re-loading resources for ", lng, fallbackLng, ns)
                    nsi18n.store.data = {}
                    nsi18n.reloadResources([lng, fallbackLng], ns)
                })
            })
        }, 100)

    }
}

const pushMissingKeys2 = async () => {

    const shoulReload = missingKeysRequests.size > 0 || fallbackLanguageValuesToBeUpdated.length > 0;

    if (missingKeysRequests.size > 0) {

        const flatReqs: KK[] = []
        missingKeysRequests.forEach((v, ns) => {
            v.forEach((l, key) => {
                flatReqs.push({key: key, namespace: ns, text: l.text, language: l.lng});
            })
        })

        const chunkSize = 100;
        const chunks: KK[][] = []
        for (let i = 0; i < flatReqs.length; i += chunkSize) {
            chunks.push(flatReqs.slice(i, i + chunkSize));
        }

        await Promise.all(chunks.map(async (reqs: KK[]) => {
            await pushKeys(reqs)
            await updateTranslations(reqs)

            reqs.forEach((v: {key: string, language: string, text: string, namespace: string}) => {
                if (missingKeysRequests.get(v.namespace)) {
                    missingKeysRequests.get(v.namespace)!.delete(v.key)
                }
                if (missingKeysRequests.get(v.namespace) && missingKeysRequests.get(v.namespace)!.size == 0) {
                    missingKeysRequests.delete(v.namespace)
                }
            })
        }))

    }

    if (fallbackLanguageValuesToBeUpdated.length > 0) {
        const chunkSize = 100;
        const chunks: KK[][] = []
        for (let i = 0; i < fallbackLanguageValuesToBeUpdated.length; i += chunkSize) {
            chunks.push(fallbackLanguageValuesToBeUpdated.slice(i, i + chunkSize));
        }

        await Promise.all(chunks.map(async (reqs: KK[]) => {
            await deleteKeys(reqs)
            await pushKeys(reqs)
            await updateTranslations(reqs)
        }))

        fallbackLanguageValuesToBeUpdated.length = 0;


    }

    if (shoulReload) {
        setTimeout(() => {
            getI18nByLangByNs().forEach((lngNsI18n, lng) => {
                lngNsI18n.forEach((nsi18n: i18n, ns) => {
                    // nsi18n.loadResources()
                    const fallbackLng: string = Array.isArray(nsi18n.options.fallbackLng) ? nsi18n.options.fallbackLng[0] : nsi18n.options.fallbackLng;
                    console.log("re-loading resources for ", lng, fallbackLng, ns)
                    nsi18n.store.data = {}
                    nsi18n.reloadResources([lng, fallbackLng], ns)
                })
            })
        }, 100)

    }
}

setInterval(() => pushMissingKeys2(), 10000)

export function getOptions (lng: string, ns: string, fallbackLng: string/*, languages: string[]*/) {
    return {
        // debug: true,
        // supportedLngs: languages,
        fallbackLng: fallbackLng,
        supportedLngs: [fallbackLng, lng],
        lng,
        ns,
        saveMissing: true,//fallbackLng === lng,
        missingKeyHandler: missingKeyHandler
    }
}