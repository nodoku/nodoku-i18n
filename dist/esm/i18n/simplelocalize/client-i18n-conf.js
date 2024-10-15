var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
import i18next from "i18next";
import { initReactI18next, useTranslation } from "react-i18next";
// import resourcesToBackend from "i18next-resources-to-backend";
import { getOptions } from "./settings";
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
export function useTranslationClient(lng, ns, languages, resources) {
    if (!i18next.isInitialized && languages) {
        i18next
            .use(initReactI18next)
            // .use(resourcesToBackend(translationToResource))
            .init(__assign(__assign({}, getOptions(lng, ns, 'en' /*, languages*/)), { resources: resources }));
    }
    return useTranslation(ns, getOptions(lng, ns, 'en' /*, languages*/));
}
