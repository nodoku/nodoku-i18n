import {createInstance, i18n} from 'i18next'
import resourcesToBackend from 'i18next-resources-to-backend'
// import {apiKey, onFallbackLanguageValueChange} from './settings'
import LanguageDefImpl from "../language-def-impl";
import {NdTranslatedText} from "nodoku-core";
import {load} from "js-yaml";
import {I18nStore, MissingKeyHandler, TranslationResourceLoader} from "../i18n-store";
import {SimplelocalizeBackendApiClient} from "./simplelocalize-backend-api-client";


const runsOnServerSide = typeof window === 'undefined'

if (!runsOnServerSide) {
    throw new Error("this config is intended on server side only")
}


// async function loadNamespacesForLanguage(lng: string, nampespaces: string[], fallbackLng: string): Promise<{lng: string, ns: string, i18n: i18n}[]> {
    // return await Promise.all(
    //     nampespaces.map(async ns => {
    //         // const i18n = await initI18next(lng, ns, fallbackLng);
    //         // // console.log("created lng ns", lng, ns, JSON.stringify(i18n))
    //         // return {lng: lng, ns: ns, i18n: i18n};
    //         let i18n = i18nByLangByNs.get(lng)?.get(ns)
    //         if (!i18n) {
    //             i18n = await initI18next(lng, ns, fallbackLng);
    //             // console.log("created lng ns", lng, ns, JSON.stringify(i18n))
    //         }
    //         await i18n.reloadResources(/*[lng, fallbackLng], ns*/)
    //         return {lng: lng, ns: ns, i18n: i18n};
    //     })
    // );

// }


// export async function initStore(lng: string, nampespaces: string[], fallbackLng: string): Promise<void> {
//     // const k1: {lng: string, ns: string, i18n: i18n}[] = await Promise.all(
//     //     nampespaces.map(async ns => {
//     //         const i18n = await initI18next(lng, ns, fallbackLng);
//     //         // console.log("created lng ns", lng, ns, JSON.stringify(i18n))
//     //         return {lng: lng, ns: ns, i18n: i18n};
//     //     })
//     // );
//     // const k2: {lng: string, ns: string, i18n: i18n}[] = (await Promise.all(
//     //     nampespaces
//     //         .map(async ns => {
//     //             if (!i18nByLangByNs.get(fallbackLng)?.get(ns)) {
//     //                 const i18n = await initI18next(fallbackLng, ns, fallbackLng);
//     //                 console.log("created lng ns", lng, ns, JSON.stringify(i18n))
//     //                 return {lng: fallbackLng, ns: ns, i18n: i18n};
//     //             } else {
//     //                 return undefined;
//     //             }
//     //         })
//     // ))
//     //     .filter(nsLoaded => nsLoaded != undefined)
//     //     .map(nsLoaded => nsLoaded as { lng: string, ns: string, i18n: i18n })
//
//     // const k1: {lng: string, ns: string, i18n: i18n}[] = await loadNamespacesForLanguage(lng, nampespaces, fallbackLng);
//     // // const k2: {lng: string, ns: string, i18n: i18n}[] = await loadNamespacesForLanguage(fallbackLng, nampespaces, fallbackLng);
//     //
//     // const k = k1.concat(/*k2*/[])
//     //
//     // console.log("this is k concatenated ", k.map(l => {return {lng: l.lng, ns: l.ns}}))
//     // k.forEach((i: {lng: string, ns: string, i18n: i18n}) => {
//     //     const {lng, ns, i18n} = i;
//     //     if (!i18nByLangByNs.get(lng)) {
//     //         i18nByLangByNs.set(lng, new Map())
//     //     }
//     //     i18nByLangByNs.get(lng)!.set(ns, i18n)
//     // })
//     //
//     // console.log("loaded namespaces", nampespaces)
//
//     await I18nStore.initStore(lng, nampespaces, fallbackLng,
//         SimplelocalizeBackendApiClient.translationToResource,
//         SimplelocalizeBackendApiClient.missingKeyHandler);
//
// }

