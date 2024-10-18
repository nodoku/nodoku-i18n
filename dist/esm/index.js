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
import { I18nStore } from "./i18n/i18n-store";
import { OnFallbackLngTextUpdateStrategyImpl, SimplelocalizeBackendApiClient } from "./i18n/simplelocalize/simplelocalize-backend-api-client";
export var NodokuI18n;
(function (NodokuI18n) {
    var Simplelocalize;
    (function (Simplelocalize) {
        Simplelocalize.OnfallbackLngTextUpdateStrategy = OnFallbackLngTextUpdateStrategyImpl;
        function initI18nStore(lng_1, nampespaces_1, fallbackLng_1) {
            return __awaiter(this, arguments, void 0, function (lng, nampespaces, fallbackLng, onFallbackLngTextUpdateStrategy) {
                var allLlngs, all, _i, allLlngs_1, lng_2, i18n;
                if (onFallbackLngTextUpdateStrategy === void 0) { onFallbackLngTextUpdateStrategy = OnFallbackLngTextUpdateStrategyImpl.update_fallback_lng_only; }
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0: return [4 /*yield*/, allLanguages()];
                        case 1:
                            allLlngs = _a.sent();
                            all = [];
                            _i = 0, allLlngs_1 = allLlngs;
                            _a.label = 2;
                        case 2:
                            if (!(_i < allLlngs_1.length)) return [3 /*break*/, 5];
                            lng_2 = allLlngs_1[_i];
                            if (!(lng_2.key !== fallbackLng)) return [3 /*break*/, 4];
                            return [4 /*yield*/, I18nStore.initStore(lng_2.key, nampespaces, fallbackLng, SimplelocalizeBackendApiClient.resourceLoader, SimplelocalizeBackendApiClient.missingKeyHandler)];
                        case 3:
                            i18n = _a.sent();
                            all.push(i18n);
                            _a.label = 4;
                        case 4:
                            _i++;
                            return [3 /*break*/, 2];
                        case 5:
                            console.log("loaded i18n's :", all.map(function (i) {
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
        }
        Simplelocalize.initI18nStore = initI18nStore;
        function allLanguages() {
            return __awaiter(this, void 0, void 0, function () {
                return __generator(this, function (_a) {
                    return [2 /*return*/, SimplelocalizeBackendApiClient.allLanguagesImpl()];
                });
            });
        }
        Simplelocalize.allLanguages = allLanguages;
        function i18nForNodoku(lng) {
            return __awaiter(this, void 0, void 0, function () {
                return __generator(this, function (_a) {
                    return [2 /*return*/, I18nStore.i18nForNodokuImpl(lng, SimplelocalizeBackendApiClient.onFallbackLanguageValueChange, SimplelocalizeBackendApiClient.onPushMissingTranslation)];
                });
            });
        }
        Simplelocalize.i18nForNodoku = i18nForNodoku;
    })(Simplelocalize = NodokuI18n.Simplelocalize || (NodokuI18n.Simplelocalize = {}));
})(NodokuI18n || (NodokuI18n = {}));
