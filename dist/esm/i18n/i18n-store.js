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
import { createInstance } from "i18next";
import { SimplelocalizeBackendApiClient } from "./simplelocalize/simplelocalize-backend-api-client";
var delay = function (ms) { return new Promise(function (res) { return setTimeout(res, ms); }); };
var I18nStore = /** @class */ (function () {
    function I18nStore() {
    }
    I18nStore.getI18nByLangByNs = function (lng) {
        return I18nStore.i18nByLang.get(lng);
    };
    I18nStore.getAllI18n = function () {
        return Array.from(I18nStore.i18nByLang.values());
    };
    I18nStore.initStore = function (allLlngs, nampespaces, fallbackLng, onFallbackLngTextUpdateStrategy, resourceLoader, missingKeyHandler) {
        return __awaiter(this, void 0, void 0, function () {
            var _i, allLlngs_1, lng;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _i = 0, allLlngs_1 = allLlngs;
                        _a.label = 1;
                    case 1:
                        if (!(_i < allLlngs_1.length)) return [3 /*break*/, 4];
                        lng = allLlngs_1[_i];
                        if (!(lng !== fallbackLng)) return [3 /*break*/, 3];
                        return [4 /*yield*/, I18nStore.initStoreForLng(lng, nampespaces, fallbackLng, resourceLoader, missingKeyHandler)];
                    case 2:
                        _a.sent();
                        _a.label = 3;
                    case 3:
                        _i++;
                        return [3 /*break*/, 1];
                    case 4: return [4 /*yield*/, I18nStore.reloadResources()];
                    case 5:
                        _a.sent();
                        console.log("loaded i18n's :", Array.from(I18nStore.i18nByLang.values()).map(function (i) {
                            return {
                                lng: i.language,
                                loaded: i.hasLoadedNamespace(nampespaces)
                            };
                        }));
                        SimplelocalizeBackendApiClient.onFallbackLngTextUpdateStrategy = onFallbackLngTextUpdateStrategy;
                        setInterval(SimplelocalizeBackendApiClient.pushMissingKeys, 10000);
                        return [2 /*return*/];
                }
            });
        });
    };
    I18nStore.initStoreForLng = function (lng, nampespaces, fallbackLng, resourceLoader, missingKeyHandler) {
        return __awaiter(this, void 0, void 0, function () {
            var i18n;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        if (I18nStore.i18nByLang.has(lng)) {
                            return [2 /*return*/];
                        }
                        return [4 /*yield*/, I18nStore.createAndInitI18next(lng, nampespaces, fallbackLng, resourceLoader, missingKeyHandler)];
                    case 1:
                        i18n = _a.sent();
                        console.log("loaded i18n", lng /*, i18n.store.data*/);
                        I18nStore.i18nByLang.set(lng, i18n);
                        return [2 /*return*/];
                }
            });
        });
    };
    I18nStore.createAndInitI18next = function (lng, namespaces, fallbackLng, translationToResource, missingKeyHandler) {
        return __awaiter(this, void 0, void 0, function () {
            var i18nInstance, options;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        i18nInstance = createInstance();
                        return [4 /*yield*/, I18nStore.createOptions(lng, namespaces, fallbackLng, translationToResource, missingKeyHandler)];
                    case 1:
                        options = _a.sent();
                        return [4 /*yield*/, i18nInstance.init(options)];
                    case 2:
                        _a.sent();
                        return [2 /*return*/, i18nInstance];
                }
            });
        });
    };
    I18nStore.reloadResources = function () {
        return __awaiter(this, void 0, void 0, function () {
            var _i, _a, i18n, options, lng, namespaces, fallbackLng, translationToResource, _b;
            return __generator(this, function (_c) {
                switch (_c.label) {
                    case 0:
                        _i = 0, _a = Array.from(I18nStore.i18nByLang.values());
                        _c.label = 1;
                    case 1:
                        if (!(_i < _a.length)) return [3 /*break*/, 6];
                        i18n = _a[_i];
                        options = i18n.options;
                        lng = i18n.languages[0];
                        namespaces = Array.isArray(options.ns) ? options.ns || [] : [options.ns];
                        fallbackLng = Array.isArray(options.fallbackLng) ? options.fallbackLng[0] : options.fallbackLng;
                        translationToResource = options.translationToResource;
                        _b = options;
                        return [4 /*yield*/, this.loadTranslations(lng, namespaces, fallbackLng, translationToResource)];
                    case 2:
                        _b.resources = _c.sent();
                        return [4 /*yield*/, i18n.init(options)];
                    case 3:
                        _c.sent();
                        console.log("loaded translation resources for ", lng, fallbackLng);
                        return [4 /*yield*/, delay(100)];
                    case 4:
                        _c.sent();
                        _c.label = 5;
                    case 5:
                        _i++;
                        return [3 /*break*/, 1];
                    case 6: return [2 /*return*/];
                }
            });
        });
    };
    I18nStore.loadTranslations = function (lng, namespaces, fallbackLng, translationToResource) {
        return __awaiter(this, void 0, void 0, function () {
            var languageTranslationResource, _i, namespaces_1, ns, _a, _b, _c, _d;
            return __generator(this, function (_e) {
                switch (_e.label) {
                    case 0:
                        languageTranslationResource = {};
                        _i = 0, namespaces_1 = namespaces;
                        _e.label = 1;
                    case 1:
                        if (!(_i < namespaces_1.length)) return [3 /*break*/, 5];
                        ns = namespaces_1[_i];
                        languageTranslationResource[lng] = {};
                        _a = languageTranslationResource[lng];
                        _b = ns;
                        return [4 /*yield*/, translationToResource(lng, ns)];
                    case 2:
                        _a[_b] = _e.sent();
                        languageTranslationResource[fallbackLng] = {};
                        _c = languageTranslationResource[fallbackLng];
                        _d = ns;
                        return [4 /*yield*/, translationToResource(fallbackLng, ns)];
                    case 3:
                        _c[_d] = _e.sent();
                        _e.label = 4;
                    case 4:
                        _i++;
                        return [3 /*break*/, 1];
                    case 5: return [2 /*return*/, languageTranslationResource];
                }
            });
        });
    };
    I18nStore.createOptions = function (lng, namespaces, fallbackLng, translationToResource, missingKeyHandler) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/, {
                        // debug: true,
                        // supportedLngs: languages,
                        resources: {},
                        fallbackLng: fallbackLng,
                        supportedLngs: [fallbackLng, lng],
                        lng: lng,
                        ns: namespaces,
                        saveMissing: true, //fallbackLng === lng,
                        translationToResource: translationToResource,
                        missingKeyHandler: missingKeyHandler
                    }];
            });
        });
    };
    I18nStore.translate = function (lng, ns, key) {
        var i18n = I18nStore.i18nByLang.get(lng);
        if (!i18n) {
            return "translation n/a";
        }
        var t = i18n.getFixedT(lng, ns);
        return t(key);
    };
    I18nStore.translateNdTranslatedText = function (lng, onFallbackLanguageValueChange, text) {
        var i18n = I18nStore.getI18nByLangByNs(lng);
        if (i18n) {
            var fallbackLng = Array.isArray(i18n.options.fallbackLng) ? i18n.options.fallbackLng[0] : i18n.options.fallbackLng;
            /*
             * make sure the fallback lng translation is intercepted by the missing key handler and eventually written to backend
             */
            var fallbackText = text.excludeFromTranslation ? I18nStore.wrapInBraces(text.text.trim()) : text.text.trim();
            var existingFallback = i18n.getFixedT(fallbackLng, text.ns)(text.key, fallbackText);
            if (existingFallback !== fallbackText) {
                console.log("detected translation change: ", existingFallback, fallbackText);
                onFallbackLanguageValueChange(fallbackLng, text.ns, text.key, fallbackText);
            }
            var details = i18n.getFixedT(lng, text.ns)(text.key, { returnDetails: true });
            // console.log(">>>>>>>.... details", this.unwrapFromBraces(details.res), details, existingFallback)
            var translationExists = details.usedLng === lng && details.res && details.res.length > 0;
            if (translationExists) {
                return I18nStore.unwrapFromBraces(details.res);
            }
            else if (text.excludeFromTranslation && existingFallback.length > 0) {
                return I18nStore.unwrapFromBraces(existingFallback);
            }
            return I18nStore.decorateUntranslated(lng, text, existingFallback);
        }
        else {
            return "".concat(lng, ".{").concat(text.ns, ":").concat(text.key, "}");
        }
    };
    I18nStore.i18nForNodokuImpl = function (lng, fallbackLanguageValueChangeHandler) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/, {
                        t: function (text) { return I18nStore.translateNdTranslatedText(lng, fallbackLanguageValueChangeHandler, text); }
                    }];
            });
        });
    };
    I18nStore.wrapInBraces = function (text) {
        if (text.length == 0) {
            return text;
        }
        return "{".concat(text, "}");
    };
    I18nStore.unwrapFromBraces = function (text) {
        if (text.length == 0) {
            return text;
        }
        if (text.startsWith("{") && text.endsWith("}")) {
            return text.substring(1, text.length - 1);
        }
        return text;
    };
    I18nStore.decorateUntranslated = function (lng, text, existingFallback) {
        return "<small style=\"font-size: 12px\">n/a ".concat(lng, ":").concat(text.ns, ":").concat(text.key, "</small>[").concat(existingFallback, "]");
    };
    I18nStore.i18nByLang = new Map();
    return I18nStore;
}());
export { I18nStore };
//# sourceMappingURL=i18n-store.js.map