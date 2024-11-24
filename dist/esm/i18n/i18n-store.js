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
export var delay = function (ms) { return new Promise(function (res) { return setTimeout(res, ms); }); };
var I18nStore = /** @class */ (function () {
    function I18nStore() {
    }
    I18nStore.initStore = function (allLngs, nampespaces, fallbackLng, saveMissing, onFallbackLngTextUpdateStrategy, resourceLoader, missingKeyHandler) {
        return __awaiter(this, void 0, void 0, function () {
            var k, instanceInCreation;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        if (!(I18nStore.sharedI18n != undefined)) return [3 /*break*/, 2];
                        return [4 /*yield*/, I18nStore.reloadResources(I18nStore.sharedI18n)];
                    case 1:
                        _a.sent();
                        return [2 /*return*/];
                    case 2:
                        if (!I18nStore.isInitStarted) return [3 /*break*/, 6];
                        k = 200;
                        _a.label = 3;
                    case 3:
                        if (!(k-- >= 0 && I18nStore.sharedI18n == undefined)) return [3 /*break*/, 5];
                        return [4 /*yield*/, delay(1000)];
                    case 4:
                        _a.sent();
                        return [3 /*break*/, 3];
                    case 5:
                        if (I18nStore.sharedI18n == undefined) {
                            throw new Error("has been waiting for initialization, but failed...");
                        }
                        return [2 /*return*/];
                    case 6:
                        I18nStore.isInitStarted = true;
                        return [4 /*yield*/, I18nStore.createAndInitI18next(allLngs, nampespaces, fallbackLng, saveMissing, resourceLoader, missingKeyHandler)];
                    case 7:
                        instanceInCreation = _a.sent();
                        return [4 /*yield*/, I18nStore.reloadResources(instanceInCreation)];
                    case 8:
                        _a.sent();
                        SimplelocalizeBackendApiClient.onFallbackLngTextUpdateStrategy = onFallbackLngTextUpdateStrategy;
                        setInterval(SimplelocalizeBackendApiClient.pushMissingKeys, 10000);
                        I18nStore.sharedI18n = instanceInCreation;
                        I18nStore.isInitStarted = false;
                        return [2 /*return*/];
                }
            });
        });
    };
    I18nStore.createAndInitI18next = function (allLngs, namespaces, fallbackLng, saveMissing, translationToResource, missingKeyHandler) {
        return __awaiter(this, void 0, void 0, function () {
            var i18nInstance, options;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        i18nInstance = createInstance();
                        return [4 /*yield*/, I18nStore.createOptions(allLngs, namespaces, fallbackLng, saveMissing, translationToResource, missingKeyHandler)];
                    case 1:
                        options = _a.sent();
                        return [4 /*yield*/, i18nInstance.init(options)
                            // i18nInstance.languages = allLngs;
                        ];
                    case 2:
                        _a.sent();
                        // i18nInstance.languages = allLngs;
                        return [2 /*return*/, i18nInstance];
                }
            });
        });
    };
    I18nStore.reloadResources = function () {
        return __awaiter(this, arguments, void 0, function (i18n) {
            var i18nInstance, options, namespaces, fallbackLng, translationToResource, _a;
            if (i18n === void 0) { i18n = undefined; }
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        i18nInstance = i18n == undefined ? I18nStore.sharedI18n : i18n;
                        if (!i18nInstance) return [3 /*break*/, 3];
                        options = i18nInstance.options;
                        namespaces = Array.isArray(options.ns) ? options.ns || [] : [options.ns];
                        fallbackLng = Array.isArray(options.fallbackLng) ? options.fallbackLng[0] : options.fallbackLng;
                        translationToResource = options.translationToResource;
                        // options.resources = await translationToResource(I18nStore.sharedI18n.languages, namespaces);
                        _a = options;
                        return [4 /*yield*/, translationToResource(options.supportedLngs, namespaces)];
                    case 1:
                        // options.resources = await translationToResource(I18nStore.sharedI18n.languages, namespaces);
                        _a.resources = _b.sent();
                        return [4 /*yield*/, /*I18nStore.sharedI18n*/ i18nInstance.init(options)];
                    case 2:
                        _b.sent();
                        console.log("loaded translation resources for ", options.supportedLngs.join(", "), fallbackLng);
                        _b.label = 3;
                    case 3: return [2 /*return*/];
                }
            });
        });
    };
    I18nStore.createOptions = function (allLngs, namespaces, fallbackLng, saveMissing, translationToResource, missingKeyHandler) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/, {
                        // debug: true,
                        resources: {},
                        fallbackLng: fallbackLng,
                        supportedLngs: allLngs,
                        lng: fallbackLng,
                        ns: namespaces,
                        saveMissing: saveMissing,
                        preload: allLngs,
                        updateMissing: saveMissing,
                        translationToResource: translationToResource,
                        missingKeyHandler: missingKeyHandler
                    }];
            });
        });
    };
    I18nStore.translate = function (lng, ns, key) {
        if (!I18nStore.sharedI18n) {
            return "translation n/a";
        }
        return I18nStore.sharedI18n.getFixedT(lng, ns)(key);
    };
    I18nStore.translateTranslatableText = function (lng, onFallbackLanguageValueChange, text) {
        if (I18nStore.sharedI18n) {
            var fallbackLng = Array.isArray(I18nStore.sharedI18n.options.fallbackLng) ?
                I18nStore.sharedI18n.options.fallbackLng[0] : I18nStore.sharedI18n.options.fallbackLng;
            /*
             * make sure the fallback lng translation is intercepted by the missing key handler and eventually written to backend
             */
            var fallbackText = text.excludeFromTranslation ? I18nStore.wrapInBraces(text.text.trim()) : text.text.trim();
            var existingFallback = I18nStore.sharedI18n.getFixedT(fallbackLng, text.ns)(text.key, fallbackText);
            if (existingFallback !== fallbackText) {
                console.log("detected translation change: ", existingFallback, fallbackText);
                onFallbackLanguageValueChange(fallbackLng, text.ns, text.key, fallbackText);
            }
            var details = I18nStore.sharedI18n.getFixedT(lng, text.ns)(text.key, { returnDetails: true });
            // console.log(">>>>>>>.... details", this.unwrapFromBraces(details.res), details, existingFallback)
            var translationExists = details.usedLng === lng && details.res && details.res.length > 0;
            if (translationExists) {
                // console.log("text is included in translation")
                return I18nStore.unwrapFromBraces(details.res);
            }
            else if (text.excludeFromTranslation && existingFallback.length > 0) {
                // console.log("text is excluded from translation")
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
                        t: function (text) { return I18nStore.translateTranslatableText(lng, fallbackLanguageValueChangeHandler, text); }
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
    I18nStore.sharedI18n = undefined;
    I18nStore.isInitStarted = false;
    return I18nStore;
}());
export { I18nStore };
