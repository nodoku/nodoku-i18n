var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
// const endpoint = `https://api.simplelocalize.io/api/v1/translations`;
import { getI18nByLangByNs } from "./server-i18n-conf";
var endpointUpdateKeys = "https://api.simplelocalize.io/api/v2/translations/bulk";
var endpointUploadKeys = "https://api.simplelocalize.io/api/v1/translation-keys/bulk";
var missingKeysRequests = new Map();
export var apiKey = process.env.SIMPLELOCALIZE_API_KEY ? process.env.SIMPLELOCALIZE_API_KEY : "n-a";
var fallbackLanguageValuesToBeUpdated = [];
export function onFallbackLanguageValueChange(language, namespace, key, text) {
    fallbackLanguageValuesToBeUpdated.push({ language: language, namespace: namespace, key: key, text: text });
}
function missingKeyHandler(languages, namespace, key, fallbackValue) {
    console.log("received missing key: ", namespace, key, languages, fallbackValue);
    languages.forEach(function (l) {
        if (!missingKeysRequests.has(namespace)) {
            missingKeysRequests.set(namespace, new Map());
        }
        if (!missingKeysRequests.get(namespace).has(key)) {
            /*
             * here we rely on the fact that the fallback lng translation is queried first
             * see i18nForNodokuImpl for details, when i18n.getFixedT is called prior to i18n.t
             */
            missingKeysRequests.get(namespace).set(key, { lng: l, text: fallbackValue });
        }
    });
    // const flatReqs: {key: string, language: string, text: string, namespace: string}[] = []
    // missingKeysRequests.forEach((v, ns) => {
    //     v.forEach((l, key) => {
    //         flatReqs.push({key: key, namespace: ns, text: l.text, language: l.lng});
    //     })
    // })
    // console.log("updated missing keys: ", flatReqs)
}
function pushKeys(reqs) {
    return __awaiter(this, void 0, void 0, function () {
        var requestBodyKeys, resp, json;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    requestBodyKeys = {
                        translationKeys: reqs.map(function (r) { return { key: r.key, namespace: r.namespace }; })
                    };
                    return [4 /*yield*/, fetch(endpointUploadKeys, {
                            method: 'POST',
                            mode: 'cors',
                            headers: {
                                'Content-Type': 'application/json',
                                'X-SimpleLocalize-Token': apiKey
                            },
                            body: JSON.stringify(requestBodyKeys),
                        })];
                case 1:
                    resp = _a.sent();
                    return [4 /*yield*/, resp.json()];
                case 2:
                    json = _a.sent();
                    console.log("pushed keys", requestBodyKeys, JSON.stringify(json));
                    return [2 /*return*/];
            }
        });
    });
}
function updateTranslations(reqs) {
    return __awaiter(this, void 0, void 0, function () {
        var requestBodyTranslations, resp, json;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    requestBodyTranslations = {
                        translations: reqs
                    };
                    return [4 /*yield*/, fetch(endpointUpdateKeys, {
                            method: 'PATCH',
                            mode: 'cors',
                            headers: {
                                'Content-Type': 'application/json',
                                'X-SimpleLocalize-Token': apiKey
                            },
                            body: JSON.stringify(requestBodyTranslations),
                        })];
                case 1:
                    resp = _a.sent();
                    return [4 /*yield*/, resp.json()];
                case 2:
                    json = _a.sent();
                    console.log("updated translations", requestBodyTranslations, JSON.stringify(json));
                    return [2 /*return*/];
            }
        });
    });
}
function deleteKeys(reqs) {
    return __awaiter(this, void 0, void 0, function () {
        var requestBodyKeys, resp, json;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    requestBodyKeys = {
                        translationKeys: []
                    };
                    reqs.forEach(function (kk) {
                        console.log("deleting translation key ", kk.namespace, kk.key);
                        requestBodyKeys.translationKeys.push({
                            namespace: kk.namespace,
                            key: kk.key,
                        });
                    });
                    return [4 /*yield*/, fetch(endpointUploadKeys, {
                            method: 'DELETE',
                            mode: 'cors',
                            headers: {
                                'Content-Type': 'application/json',
                                'X-SimpleLocalize-Token': apiKey
                            },
                            body: JSON.stringify(requestBodyKeys),
                        })];
                case 1:
                    resp = _a.sent();
                    return [4 /*yield*/, resp.json()];
                case 2:
                    json = _a.sent();
                    console.log("deleted keys", requestBodyKeys, JSON.stringify(json));
                    return [2 /*return*/];
            }
        });
    });
}
var pushMissingKeys = function () {
    // console.log(`[SimpleLocalize] Checking for missing keys: ${missingKeysRequests.length}`);
    var shoulReload = missingKeysRequests.size > 0 || fallbackLanguageValuesToBeUpdated.length > 0;
    if (missingKeysRequests.size > 0) {
        var flatReqs_1 = [];
        missingKeysRequests.forEach(function (v, ns) {
            v.forEach(function (l, key) {
                flatReqs_1.push({ key: key, namespace: ns, text: l.text, language: l.lng });
            });
        });
        var chunkSize = 100;
        var chunks = [];
        for (var i = 0; i < flatReqs_1.length; i += chunkSize) {
            chunks.push(flatReqs_1.slice(i, i + chunkSize));
        }
        chunks.forEach(function (reqs) { return __awaiter(void 0, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: 
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
                    return [4 /*yield*/, pushKeys(reqs)
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
                    ];
                    case 1:
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
                        _a.sent();
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
                        return [4 /*yield*/, updateTranslations(reqs)];
                    case 2:
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
                        _a.sent();
                        reqs.forEach(function (v) {
                            if (missingKeysRequests.get(v.namespace)) {
                                missingKeysRequests.get(v.namespace).delete(v.key);
                            }
                            if (missingKeysRequests.get(v.namespace) && missingKeysRequests.get(v.namespace).size == 0) {
                                missingKeysRequests.delete(v.namespace);
                            }
                        });
                        return [2 /*return*/];
                }
            });
        }); });
    }
    if (fallbackLanguageValuesToBeUpdated.length > 0) {
        var chunkSize = 100;
        var chunks = [];
        for (var i = 0; i < fallbackLanguageValuesToBeUpdated.length; i += chunkSize) {
            chunks.push(fallbackLanguageValuesToBeUpdated.slice(i, i + chunkSize));
        }
        chunks.forEach(function (reqs) { return __awaiter(void 0, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: 
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
                    return [4 /*yield*/, deleteKeys(reqs)];
                    case 1:
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
                        _a.sent();
                        console.log("updated");
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
                        return [4 /*yield*/, pushKeys(reqs)
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
                        ];
                    case 2:
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
                        _a.sent();
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
                        return [4 /*yield*/, updateTranslations(reqs)
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
                        ];
                    case 3:
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
                        _a.sent();
                        return [2 /*return*/];
                }
            });
        }); });
        fallbackLanguageValuesToBeUpdated.length = 0;
    }
    if (shoulReload) {
        setTimeout(function () {
            getI18nByLangByNs().forEach(function (lngNsI18n, lng) {
                lngNsI18n.forEach(function (nsi18n, ns) {
                    // nsi18n.loadResources()
                    var fallbackLng = Array.isArray(nsi18n.options.fallbackLng) ? nsi18n.options.fallbackLng[0] : nsi18n.options.fallbackLng;
                    console.log("re-loading resources for ", lng, fallbackLng, ns);
                    nsi18n.store.data = {};
                    nsi18n.reloadResources([lng, fallbackLng], ns);
                });
            });
        }, 100);
    }
};
var pushMissingKeys2 = function () { return __awaiter(void 0, void 0, void 0, function () {
    var shoulReload, flatReqs_2, chunkSize, chunks, i, chunkSize, chunks, i;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                shoulReload = missingKeysRequests.size > 0 || fallbackLanguageValuesToBeUpdated.length > 0;
                if (!(missingKeysRequests.size > 0)) return [3 /*break*/, 2];
                flatReqs_2 = [];
                missingKeysRequests.forEach(function (v, ns) {
                    v.forEach(function (l, key) {
                        flatReqs_2.push({ key: key, namespace: ns, text: l.text, language: l.lng });
                    });
                });
                chunkSize = 100;
                chunks = [];
                for (i = 0; i < flatReqs_2.length; i += chunkSize) {
                    chunks.push(flatReqs_2.slice(i, i + chunkSize));
                }
                return [4 /*yield*/, Promise.all(chunks.map(function (reqs) { return __awaiter(void 0, void 0, void 0, function () {
                        return __generator(this, function (_a) {
                            switch (_a.label) {
                                case 0: return [4 /*yield*/, pushKeys(reqs)];
                                case 1:
                                    _a.sent();
                                    return [4 /*yield*/, updateTranslations(reqs)];
                                case 2:
                                    _a.sent();
                                    reqs.forEach(function (v) {
                                        if (missingKeysRequests.get(v.namespace)) {
                                            missingKeysRequests.get(v.namespace).delete(v.key);
                                        }
                                        if (missingKeysRequests.get(v.namespace) && missingKeysRequests.get(v.namespace).size == 0) {
                                            missingKeysRequests.delete(v.namespace);
                                        }
                                    });
                                    return [2 /*return*/];
                            }
                        });
                    }); }))];
            case 1:
                _a.sent();
                _a.label = 2;
            case 2:
                if (!(fallbackLanguageValuesToBeUpdated.length > 0)) return [3 /*break*/, 4];
                chunkSize = 100;
                chunks = [];
                for (i = 0; i < fallbackLanguageValuesToBeUpdated.length; i += chunkSize) {
                    chunks.push(fallbackLanguageValuesToBeUpdated.slice(i, i + chunkSize));
                }
                return [4 /*yield*/, Promise.all(chunks.map(function (reqs) { return __awaiter(void 0, void 0, void 0, function () {
                        return __generator(this, function (_a) {
                            switch (_a.label) {
                                case 0: return [4 /*yield*/, deleteKeys(reqs)];
                                case 1:
                                    _a.sent();
                                    return [4 /*yield*/, pushKeys(reqs)];
                                case 2:
                                    _a.sent();
                                    return [4 /*yield*/, updateTranslations(reqs)];
                                case 3:
                                    _a.sent();
                                    return [2 /*return*/];
                            }
                        });
                    }); }))];
            case 3:
                _a.sent();
                fallbackLanguageValuesToBeUpdated.length = 0;
                _a.label = 4;
            case 4:
                if (shoulReload) {
                    setTimeout(function () {
                        getI18nByLangByNs().forEach(function (lngNsI18n, lng) {
                            lngNsI18n.forEach(function (nsi18n, ns) {
                                // nsi18n.loadResources()
                                var fallbackLng = Array.isArray(nsi18n.options.fallbackLng) ? nsi18n.options.fallbackLng[0] : nsi18n.options.fallbackLng;
                                console.log("re-loading resources for ", lng, fallbackLng, ns);
                                nsi18n.store.data = {};
                                nsi18n.reloadResources([lng, fallbackLng], ns);
                            });
                        });
                    }, 100);
                }
                return [2 /*return*/];
        }
    });
}); };
setInterval(function () { return pushMissingKeys2(); }, 10000);
export function getOptions(lng, ns, fallbackLng /*, languages: string[]*/) {
    return {
        // debug: true,
        // supportedLngs: languages,
        fallbackLng: fallbackLng,
        supportedLngs: [fallbackLng, lng],
        lng: lng,
        ns: ns,
        saveMissing: true, //fallbackLng === lng,
        missingKeyHandler: missingKeyHandler
    };
}
