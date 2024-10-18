// import resourcesToBackend from "i18next-resources-to-backend";
// import {getOptions} from "./settings";
var runsOnServerSide = typeof window === 'undefined';
export var cdnBaseUrl = "https://cdn.simplelocalize.io";
export var environment = "_latest"; // or "_production"
// const translationToResource = async (language: string, ns: string) => {
//     console.log("querying the language ", language, " on namespace ", ns);
//     let backendUrl;
//     if (runsOnServerSide) {
//         const projectToken = process.env.SIMPLELOCALIZE_PROJECT_TOKEN;
//         const loadPathBase = `${cdnBaseUrl}/${projectToken}/${environment}`;
//         backendUrl = `${loadPathBase}/${language}/${ns}`
//     } else {
//         backendUrl = `${location.origin}/api/i18n/${language}/${ns}`;
//     }
//
//     console.log("language query url: ", backendUrl);
//
//     const resp = await fetch(backendUrl);
//     return await resp.json()
// }
// export function useTranslationClient(lng: string, ns: string, languages: string[], resources: Resource)  {
//
//
//
//     if (!i18next.isInitialized && languages) {
//         i18next
//             .use(initReactI18next)
//             // .use(resourcesToBackend(translationToResource))
//             .init({...getOptions(lng, ns, 'en'/*, languages*/), resources: resources})
//     }
//
//     return useTranslation(ns, getOptions(lng, ns, 'en'/*, languages*/));
// }
