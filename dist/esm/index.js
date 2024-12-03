import { I18nStoreImpl } from "./i18n/store/i18n-store-impl";
import { OnFallbackLngTextUpdateStrategyImpl, SimplelocalizeBackendApiClient } from "./i18n/vendor/simplelocalize/simplelocalize-backend-api-client";
import { OnMissingKeyStrategyImpl } from "./i18n/vendor/simplelocalize/simplelocalize-backend-api-client";
import { AbstractI18nStore } from "./i18n/store/abstract-i18n-store";
import { SimplelocalizeMissingKeyStorage } from "./i18n/vendor/simplelocalize/simplelocalize-missing-key-storage";
export var NodokuI18n;
(function (NodokuI18n) {
    class I18nStore extends AbstractI18nStore {
    }
    NodokuI18n.I18nStore = I18nStore;
    let Simplelocalize;
    (function (Simplelocalize) {
        Simplelocalize.OnFallbackLngTextUpdateStrategy = OnFallbackLngTextUpdateStrategyImpl;
        Simplelocalize.OnMissingKeyStrategy = OnMissingKeyStrategyImpl;
        async function initI18nStore(apiKey, projectToken, allLlngs, nampespaces, fallbackLng, translationFetchMode, saveMissing, loadImmediately, onMissingKeyStrategy, onFallbackLngTextUpdateStrategy) {
            const i18nStore = I18nStoreImpl.createStore();
            const client = new SimplelocalizeBackendApiClient(apiKey, projectToken, translationFetchMode);
            const missingKeyStorage = new SimplelocalizeMissingKeyStorage(i18nStore, onMissingKeyStrategy, onFallbackLngTextUpdateStrategy);
            console.log("initialized client...");
            console.log("in initI18nStore allLlngs, saveMissing, devMode", allLlngs, saveMissing, translationFetchMode);
            const lngs = allLlngs === "all" ? (await client.allLanguages()).map(ld => ld.key) : allLlngs;
            await i18nStore.initStore(lngs, nampespaces, fallbackLng, saveMissing, loadImmediately, client, missingKeyStorage);
            if (saveMissing && onMissingKeyStrategy === OnMissingKeyStrategyImpl.upload) {
                setInterval(() => missingKeyStorage.pushMissingKeys(client), 10000);
            }
            return i18nStore;
        }
        Simplelocalize.initI18nStore = initI18nStore;
        function i18nForNodoku(store) {
            return async (lng) => {
                return { t: (text) => store.translateTranslatableText(lng, text) };
            };
        }
        Simplelocalize.i18nForNodoku = i18nForNodoku;
    })(Simplelocalize = NodokuI18n.Simplelocalize || (NodokuI18n.Simplelocalize = {}));
})(NodokuI18n || (NodokuI18n = {}));
