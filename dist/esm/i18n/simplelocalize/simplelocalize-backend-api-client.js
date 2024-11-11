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
import { delay, I18nStore } from "../i18n-store";
import { Dictionary } from "../dictionary";
var runsOnServerSide = typeof window === 'undefined';
if (!runsOnServerSide) {
    throw new Error("this config is intended on server side only");
    // console.log(new Error("this config is intended on server side only"))
}
export var projectToken = process.env.SIMPLELOCALIZE_PROJECT_TOKEN;
export var cdnBaseUrl = "https://cdn.simplelocalize.io";
export var environment = "_latest"; // or "_production"
export var apiKey = process.env.SIMPLELOCALIZE_API_KEY ? process.env.SIMPLELOCALIZE_API_KEY : "n-a";
export var loadPathBase = "".concat(cdnBaseUrl, "/").concat(projectToken, "/").concat(environment);
var loadTranslationsApiBase = "https://api.simplelocalize.io/api/v2/translations";
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
export var OnFallbackLngTextUpdateStrategyImpl;
(function (OnFallbackLngTextUpdateStrategyImpl) {
    OnFallbackLngTextUpdateStrategyImpl[OnFallbackLngTextUpdateStrategyImpl["update_fallback_lng_only"] = 0] = "update_fallback_lng_only";
    OnFallbackLngTextUpdateStrategyImpl[OnFallbackLngTextUpdateStrategyImpl["delete_translations"] = 1] = "delete_translations";
    OnFallbackLngTextUpdateStrategyImpl[OnFallbackLngTextUpdateStrategyImpl["reset_reviewed_status"] = 2] = "reset_reviewed_status";
})(OnFallbackLngTextUpdateStrategyImpl || (OnFallbackLngTextUpdateStrategyImpl = {}));
var SimplelocalizeBackendApiClient = /** @class */ (function () {
    function SimplelocalizeBackendApiClient() {
    }
    SimplelocalizeBackendApiClient.allLanguagesImpl = function () {
        return __awaiter(this, void 0, void 0, function () {
            var resp, _a, _b;
            return __generator(this, function (_c) {
                switch (_c.label) {
                    case 0: return [4 /*yield*/, fetch("".concat(loadPathBase, "/_languages"))];
                    case 1:
                        resp = _c.sent();
                        if (!!resp.ok) return [3 /*break*/, 3];
                        _a = Error.bind;
                        _b = "can't load languages: " + resp.status + ", ";
                        return [4 /*yield*/, resp.text()];
                    case 2: throw new (_a.apply(Error, [void 0, _b + (_c.sent())]))();
                    case 3: return [4 /*yield*/, resp.json()];
                    case 4: return [2 /*return*/, (_c.sent()).map(function (l) {
                            if (!l.icon) {
                                l.icon = l.key;
                            }
                            if (l.key == 'en') {
                                l.icon = 'gb';
                            }
                            return l;
                        })];
                }
            });
        });
    };
    SimplelocalizeBackendApiClient.onFallbackLanguageValueChange = function (language, namespace, key, text) {
        var missingKey = { language: language, namespace: namespace, key: key };
        SimplelocalizeBackendApiClient.fallbackLanguageValuesToBeUpdated.set(missingKey, text);
    };
    SimplelocalizeBackendApiClient.loadTranslationsUsingCdn = function (allLng, allNs) {
        return __awaiter(this, void 0, void 0, function () {
            var res;
            var _this = this;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        res = {};
                        return [4 /*yield*/, Promise.all(allLng.map(function (language) { return __awaiter(_this, void 0, void 0, function () {
                                var _this = this;
                                return __generator(this, function (_a) {
                                    switch (_a.label) {
                                        case 0: return [4 /*yield*/, Promise.all(allNs.map(function (ns) { return __awaiter(_this, void 0, void 0, function () {
                                                var resp, reply;
                                                return __generator(this, function (_a) {
                                                    switch (_a.label) {
                                                        case 0:
                                                            console.log("querying the language on CDN", language, " on namespace ", ns, "url", "".concat(loadPathBase, "/").concat(language, "/").concat(ns));
                                                            return [4 /*yield*/, fetch("".concat(loadPathBase, "/").concat(language, "/").concat(ns))];
                                                        case 1:
                                                            resp = _a.sent();
                                                            return [4 /*yield*/, resp.json()];
                                                        case 2:
                                                            reply = _a.sent();
                                                            console.log("this is reply", language, ns, reply);
                                                            return [2 /*return*/, reply];
                                                    }
                                                });
                                            }); }))];
                                        case 1:
                                            _a.sent();
                                            return [2 /*return*/];
                                    }
                                });
                            }); }))];
                    case 1:
                        _a.sent();
                        return [2 /*return*/, res];
                }
            });
        });
    };
    SimplelocalizeBackendApiClient.loadTranslationsUsingApi = function (allLng, allNs) {
        return __awaiter(this, void 0, void 0, function () {
            var finished, page, translatedReply, resp, reply;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        console.log("querying the language on API ", allLng.join(", "), " on namespace ", allNs, "url", "".concat(loadTranslationsApiBase));
                        finished = false;
                        page = 0;
                        translatedReply = {};
                        _a.label = 1;
                    case 1:
                        if (!!finished) return [3 /*break*/, 3];
                        resp = fetch("".concat(loadTranslationsApiBase, "?page=").concat(page), {
                            method: 'GET',
                            mode: 'cors',
                            headers: {
                                'Content-Type': 'application/json',
                                'X-SimpleLocalize-Token': apiKey
                            },
                            // cache: 'force-cache'
                        })
                            .then(function (resp) { return resp.json(); })
                            .catch(function (reason) { console.log("can't download translations: ", reason); });
                        return [4 /*yield*/, resp];
                    case 2:
                        reply = _a.sent();
                        if (reply.status != 200) {
                            throw new Error("can't retrieve translations: " + reply);
                        }
                        console.log("received data page ", page, reply.msg);
                        reply.data.forEach(function (t) {
                            var key = t.key;
                            var namespace = t.namespace;
                            var language = t.language;
                            var text = t.text;
                            if (!translatedReply.hasOwnProperty(language)) {
                                translatedReply[language] = {};
                            }
                            if (!translatedReply[language].hasOwnProperty(namespace)) {
                                translatedReply[language][namespace] = {};
                            }
                            translatedReply[language][namespace][key] = text;
                            // if (language === "it") {
                            //     console.log("translatedReply[language][namespace][key] = text", language, namespace, key, text)
                            // }
                        });
                        page++;
                        finished = reply.data.length == 0;
                        delay(200);
                        return [3 /*break*/, 1];
                    case 3:
                        allLng.forEach(function (lng) {
                            if (!translatedReply.hasOwnProperty(lng)) {
                                translatedReply[lng] = {};
                            }
                            allNs.forEach(function (ns) {
                                if (!translatedReply[lng].hasOwnProperty(ns)) {
                                    translatedReply[lng][ns] = {};
                                }
                            });
                        });
                        // console.log("_______translatedReply_______", allLng, allNs, translatedReply)
                        return [2 /*return*/, translatedReply];
                }
            });
        });
    };
    SimplelocalizeBackendApiClient.pushMissingKeys = function () {
        return __awaiter(this, void 0, void 0, function () {
            var shoulReload, chunks, _i, chunks_1, reqs, chunks, _a, chunks_2, reqs;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        shoulReload = SimplelocalizeBackendApiClient.missingKeysRequests.size() > 0 ||
                            SimplelocalizeBackendApiClient.fallbackLanguageValuesToBeUpdated.size() > 0;
                        if (!(SimplelocalizeBackendApiClient.missingKeysRequests.size() > 0)) return [3 /*break*/, 5];
                        chunks = SimplelocalizeBackendApiClient.flatReqsChunked(SimplelocalizeBackendApiClient.missingKeysRequests, 100);
                        _i = 0, chunks_1 = chunks;
                        _b.label = 1;
                    case 1:
                        if (!(_i < chunks_1.length)) return [3 /*break*/, 5];
                        reqs = chunks_1[_i];
                        return [4 /*yield*/, SimplelocalizeBackendApiClient.pushKeys(reqs.map(function (r) { return r.updKey; }))];
                    case 2:
                        _b.sent();
                        return [4 /*yield*/, SimplelocalizeBackendApiClient.updateTranslations(reqs)];
                    case 3:
                        _b.sent();
                        reqs.forEach(function (v) {
                            SimplelocalizeBackendApiClient.missingKeysRequests.delete(v.updKey);
                        });
                        _b.label = 4;
                    case 4:
                        _i++;
                        return [3 /*break*/, 1];
                    case 5:
                        if (!(SimplelocalizeBackendApiClient.fallbackLanguageValuesToBeUpdated.size() > 0)) return [3 /*break*/, 15];
                        chunks = SimplelocalizeBackendApiClient.flatReqsChunked(SimplelocalizeBackendApiClient.fallbackLanguageValuesToBeUpdated, 100);
                        _a = 0, chunks_2 = chunks;
                        _b.label = 6;
                    case 6:
                        if (!(_a < chunks_2.length)) return [3 /*break*/, 15];
                        reqs = chunks_2[_a];
                        if (!(SimplelocalizeBackendApiClient.onFallbackLngTextUpdateStrategy === OnFallbackLngTextUpdateStrategyImpl.delete_translations)) return [3 /*break*/, 9];
                        return [4 /*yield*/, SimplelocalizeBackendApiClient.deleteKeys(reqs.map(function (k) { return k.updKey; }))];
                    case 7:
                        _b.sent();
                        return [4 /*yield*/, SimplelocalizeBackendApiClient.pushKeys(reqs.map(function (k) { return k.updKey; }))];
                    case 8:
                        _b.sent();
                        return [3 /*break*/, 12];
                    case 9:
                        if (!(SimplelocalizeBackendApiClient.onFallbackLngTextUpdateStrategy === OnFallbackLngTextUpdateStrategyImpl.reset_reviewed_status)) return [3 /*break*/, 11];
                        return [4 /*yield*/, SimplelocalizeBackendApiClient.removeReviewed(reqs)];
                    case 10:
                        _b.sent();
                        return [3 /*break*/, 12];
                    case 11:
                        if (SimplelocalizeBackendApiClient.onFallbackLngTextUpdateStrategy === OnFallbackLngTextUpdateStrategyImpl.update_fallback_lng_only) {
                            //
                        }
                        _b.label = 12;
                    case 12: return [4 /*yield*/, SimplelocalizeBackendApiClient.updateTranslations(reqs)];
                    case 13:
                        _b.sent();
                        reqs.forEach(function (v) {
                            SimplelocalizeBackendApiClient.fallbackLanguageValuesToBeUpdated.delete(v.updKey);
                        });
                        _b.label = 14;
                    case 14:
                        _a++;
                        return [3 /*break*/, 6];
                    case 15:
                        if (!shoulReload) return [3 /*break*/, 17];
                        return [4 /*yield*/, I18nStore.reloadResources()];
                    case 16:
                        _b.sent();
                        console.log("resources reloaded...");
                        _b.label = 17;
                    case 17: return [2 /*return*/];
                }
            });
        });
    };
    SimplelocalizeBackendApiClient.pushKeys = function (reqs) {
        return __awaiter(this, void 0, void 0, function () {
            var requestBodyKeys, resp, json;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        requestBodyKeys = {
                            translationKeys: reqs.map(function (r) { return { key: r.key, namespace: r.namespace }; })
                        };
                        return [4 /*yield*/, fetch(SimplelocalizeBackendApiClient.endpointUploadKeys, {
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
    };
    SimplelocalizeBackendApiClient.updateTranslations = function (reqs) {
        return __awaiter(this, void 0, void 0, function () {
            var requestBodyTranslations, resp, json;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        requestBodyTranslations = {
                            translations: reqs.map(function (r) { return __assign(__assign({}, r.updKey), { text: r.text, reviewStatus: "REVIEWED" }); })
                        };
                        return [4 /*yield*/, fetch(SimplelocalizeBackendApiClient.endpointUpdateKeys, {
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
    };
    SimplelocalizeBackendApiClient.removeReviewed = function (reqs) {
        return __awaiter(this, void 0, void 0, function () {
            var requestBodyTranslations, allLanguages, resp, json;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        requestBodyTranslations = {
                            translations: []
                        };
                        return [4 /*yield*/, SimplelocalizeBackendApiClient.allLanguagesImpl()];
                    case 1:
                        allLanguages = _a.sent();
                        reqs.forEach(function (r) {
                            allLanguages
                                .forEach(function (lng) {
                                requestBodyTranslations.translations.push({
                                    language: lng.key,
                                    namespace: r.updKey.namespace,
                                    key: r.updKey.key,
                                    text: I18nStore.translate(lng.key, r.updKey.namespace, r.updKey.key),
                                    reviewStatus: "NOT_REVIEWED"
                                });
                            });
                        });
                        return [4 /*yield*/, fetch(SimplelocalizeBackendApiClient.endpointUpdateKeys, {
                                method: 'PATCH',
                                mode: 'cors',
                                headers: {
                                    'Content-Type': 'application/json',
                                    'X-SimpleLocalize-Token': apiKey
                                },
                                body: JSON.stringify(requestBodyTranslations),
                            })];
                    case 2:
                        resp = _a.sent();
                        return [4 /*yield*/, resp.json()];
                    case 3:
                        json = _a.sent();
                        return [2 /*return*/];
                }
            });
        });
    };
    SimplelocalizeBackendApiClient.deleteKeys = function (reqs) {
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
                        return [4 /*yield*/, fetch(SimplelocalizeBackendApiClient.endpointUploadKeys, {
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
    };
    SimplelocalizeBackendApiClient.flatReqsChunked = function (reqsAsMap, chunkSize) {
        var flatReqs = [];
        reqsAsMap.entries().forEach(function (v) {
            flatReqs.push({ updKey: { language: v[0].language, namespace: v[0].namespace, key: v[0].key }, text: v[1] });
        });
        console.log(flatReqs[0]);
        var chunks = [];
        for (var i = 0; i < flatReqs.length; i += chunkSize) {
            chunks.push(flatReqs.slice(i, i + chunkSize));
        }
        return chunks;
    };
    SimplelocalizeBackendApiClient.endpointUpdateKeys = "https://api.simplelocalize.io/api/v2/translations/bulk";
    SimplelocalizeBackendApiClient.endpointUploadKeys = "https://api.simplelocalize.io/api/v1/translation-keys/bulk";
    SimplelocalizeBackendApiClient.missingKeysRequests = new Dictionary();
    SimplelocalizeBackendApiClient.fallbackLanguageValuesToBeUpdated = new Dictionary();
    SimplelocalizeBackendApiClient.onFallbackLngTextUpdateStrategy = OnFallbackLngTextUpdateStrategyImpl.update_fallback_lng_only;
    SimplelocalizeBackendApiClient.missingKeyHandler = function (lngs, ns, key, fallbackValue, updateMissing, options) {
        // console.log("received missing key: ", lngs, ns, key, fallbackValue/*, I18nStore.getI18nByLangByNs('ru')?.store.data*/);
        lngs.forEach(function (lng) {
            var missingKey = { language: lng, namespace: ns, key: key };
            /*
             * by checking the presence of the key we ensure that only the first update will be taken into account
             * here we rely on the fact that the fallback lng translation is queried first
             * see I18nStore.i18nForNodokuImpl for details, when i18n.getFixedT is called prior to i18n.t
             */
            if (!SimplelocalizeBackendApiClient.missingKeysRequests.has(missingKey)) {
                SimplelocalizeBackendApiClient.missingKeysRequests.set(missingKey, fallbackValue);
            }
        });
    };
    SimplelocalizeBackendApiClient.resourceLoader = environment === '_latest' ?
        SimplelocalizeBackendApiClient.loadTranslationsUsingApi :
        SimplelocalizeBackendApiClient.loadTranslationsUsingCdn;
    return SimplelocalizeBackendApiClient;
}());
export { SimplelocalizeBackendApiClient };
//# sourceMappingURL=simplelocalize-backend-api-client.js.map