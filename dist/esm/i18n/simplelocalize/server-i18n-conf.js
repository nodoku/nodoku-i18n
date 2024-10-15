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
import { createInstance } from 'i18next';
import resourcesToBackend from 'i18next-resources-to-backend';
import { apiKey, getOptions, onFallbackLanguageValueChange } from './settings';
export var projectToken = process.env.SIMPLELOCALIZE_PROJECT_TOKEN;
export var cdnBaseUrl = "https://cdn.simplelocalize.io";
export var environment = "_latest"; // or "_production"
export var loadPathBase = "".concat(cdnBaseUrl, "/").concat(projectToken, "/").concat(environment);
var loadTranslationsApiBase = "https://api.simplelocalize.io/api/v2/translations";
var runsOnServerSide = typeof window === 'undefined';
if (!runsOnServerSide) {
    throw new Error("this config is intended on server side only");
}
var translationToResource = function (language, ns) { return __awaiter(void 0, void 0, void 0, function () {
    var resp, reply, translatedReply;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                // console.log("querying the language ", language, " on namespace ", ns, "url", `${loadPathBase}/${language}/${ns}`);
                console.log("querying the language ", language, " on namespace ", ns, "url", "".concat(loadTranslationsApiBase, "?namespace=").concat(ns, "&language=").concat(language));
                return [4 /*yield*/, fetch("".concat(loadTranslationsApiBase, "?namespace=").concat(ns, "&language=").concat(language), {
                        method: 'GET',
                        mode: 'cors',
                        headers: {
                            'Content-Type': 'application/json',
                            'X-SimpleLocalize-Token': apiKey
                        },
                        cache: 'no-cache'
                    })];
            case 1:
                resp = _a.sent();
                return [4 /*yield*/, resp.json()];
            case 2:
                reply = _a.sent();
                translatedReply = {};
                reply.data
                    .filter(function (t) { return t.text && t.text.length > 0; })
                    .forEach(function (t) {
                    // const p: {[key: string]: string} = {} as {[key: string]: string};
                    translatedReply[t.key] = t.text;
                    // return p;
                });
                console.log("translatedReply", language, ns, translatedReply);
                return [2 /*return*/, translatedReply];
        }
    });
}); };
export var allLanguagesImpl = function () { return __awaiter(void 0, void 0, void 0, function () {
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
}); };
var i18nByLangByNs = new Map();
export function getI18nByLangByNs() {
    return i18nByLangByNs;
}
var initI18next = function (lng, ns, fallbackLng) { return __awaiter(void 0, void 0, void 0, function () {
    var i18nInstance;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                i18nInstance = createInstance();
                return [4 /*yield*/, i18nInstance
                        .use(resourcesToBackend(translationToResource))
                        .init(getOptions(lng, ns, fallbackLng /*, (await allLanguagesImpl()).map(l => l.key)*/))];
            case 1:
                _a.sent();
                return [2 /*return*/, i18nInstance];
        }
    });
}); };
function loadNamespacesForLanguage(lng, nampespaces, fallbackLng) {
    return __awaiter(this, void 0, void 0, function () {
        var _this = this;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, Promise.all(nampespaces.map(function (ns) { return __awaiter(_this, void 0, void 0, function () {
                        var i18n;
                        var _a;
                        return __generator(this, function (_b) {
                            switch (_b.label) {
                                case 0:
                                    i18n = (_a = i18nByLangByNs.get(lng)) === null || _a === void 0 ? void 0 : _a.get(ns);
                                    if (!!i18n) return [3 /*break*/, 2];
                                    return [4 /*yield*/, initI18next(lng, ns, fallbackLng)];
                                case 1:
                                    i18n = _b.sent();
                                    _b.label = 2;
                                case 2:
                                    i18n.store.data = {};
                                    return [4 /*yield*/, i18n.reloadResources( /*[lng, fallbackLng], ns*/)];
                                case 3:
                                    _b.sent();
                                    return [2 /*return*/, { lng: lng, ns: ns, i18n: i18n }];
                            }
                        });
                    }); }))];
                case 1: return [2 /*return*/, _a.sent()];
            }
        });
    });
}
export function loadAllLangsAndNamespacesImpl(lng, nampespaces, fallbackLng) {
    return __awaiter(this, void 0, void 0, function () {
        var k1, k;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, loadNamespacesForLanguage(lng, nampespaces, fallbackLng)];
                case 1:
                    k1 = _a.sent();
                    k = k1.concat(/*k2*/ []);
                    console.log("this is k concatenated ", k.map(function (l) { return { lng: l.lng, ns: l.ns }; }));
                    k.forEach(function (i) {
                        var lng = i.lng, ns = i.ns, i18n = i.i18n;
                        if (!i18nByLangByNs.get(lng)) {
                            i18nByLangByNs.set(lng, new Map());
                        }
                        i18nByLangByNs.get(lng).set(ns, i18n);
                    });
                    console.log("loaded namespaces", nampespaces);
                    return [2 /*return*/];
            }
        });
    });
}
export function i18nForNodokuImpl(lng) {
    return __awaiter(this, void 0, void 0, function () {
        return __generator(this, function (_a) {
            return [2 /*return*/, {
                    t: function (text) {
                        var _a;
                        var i18n = (_a = i18nByLangByNs.get(lng)) === null || _a === void 0 ? void 0 : _a.get(text.ns);
                        if (i18n) {
                            var fallbackLng = Array.isArray(i18n.options.fallbackLng) ? i18n.options.fallbackLng[0] : i18n.options.fallbackLng;
                            // const fallbackI18n = i18nByLangByNs.get(fallbackLng)?.get(text.ns);
                            // if (fallbackI18n) {
                            //     console.log("setting default text for ", fallbackLng, text.text)
                            //     fallbackI18n.t(text.key, text.text.trim())
                            // }
                            /*
                             * make sure the fallback lng translation is intercepted by the missing key handler and eventually written to backend
                             */
                            var existing = i18n.getFixedT(fallbackLng)(text.key, text.text.trim());
                            if (existing !== text.text.trim()) {
                                console.log("detected translation change: ", existing, text.text.trim());
                                onFallbackLanguageValueChange(fallbackLng, text.ns, text.key, text.text.trim());
                            }
                            var details = i18n.t(text.key, { returnDetails: true });
                            console.log(">>>>>>>.... details", details);
                            return details.usedLng === lng ? details.res : "<small style=\"font-size: 12px\">n/a ".concat(lng, ":").concat(text.ns, ":").concat(text.key, "</small>[").concat(details.res, "]");
                        }
                        else {
                            return "".concat(lng, ".{").concat(text.ns, ":").concat(text.key, "}");
                        }
                    }
                }];
        });
    });
}
