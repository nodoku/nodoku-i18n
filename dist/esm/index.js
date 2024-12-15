import { I18nStoreImpl } from "./i18n/store/i18n-store-impl";
// import {SimplelocalizeBackendApiClientImpl} from "./i18n/vendor/simplelocalize/simplelocalize-backend-api-client";
import { MissingKeyStorageImpl, OnMissingKeyStrategyImpl, OnFallbackLngTextUpdateStrategyImpl } from "./i18n/backend/missing-key-storage";
import { AbstractI18nStore } from "./i18n/store/abstract-i18n-store";
// import {SimplelocalizeMissingKeyStorage} from "./i18n/vendor/simplelocalize/simplelocalize-missing-key-storage";
export const delay = (ms) => new Promise(res => setTimeout(res, ms));
export var NodokuI18n;
(function (NodokuI18n) {
    class I18nStore extends AbstractI18nStore {
    }
    NodokuI18n.I18nStore = I18nStore;
    class MissingKeyStorage extends MissingKeyStorageImpl {
    }
    NodokuI18n.MissingKeyStorage = MissingKeyStorage;
    NodokuI18n.OnFallbackLngTextUpdateStrategy = OnFallbackLngTextUpdateStrategyImpl;
    NodokuI18n.OnMissingKeyStrategy = OnMissingKeyStrategyImpl;
    async function initI18nStore(
    // apiKey: string,
    //                                 projectToken: string,
    allLlngs, nampespaces, fallbackLng, translationFetchMode, saveMissing, loadOnInit, client, missingKeyStorage
    // onMissingKeyStrategy: OnMissingKeyStrategy,
    // onFallbackLngTextUpdateStrategy: OnFallbackLngTextUpdateStrategy
    ) {
        const i18nStore = I18nStoreImpl.createStore();
        // const client: SimplelocalizeBackendApiClient =
        //     new SimplelocalizeBackendApiClient(apiKey, projectToken, translationFetchMode);
        // const missingKeyStorage: MissingKeyStorage =
        //     new SimplelocalizeMissingKeyStorage(i18nStore, onMissingKeyStrategy, onFallbackLngTextUpdateStrategy);
        console.log("initialized client...");
        console.log("in initI18nStore allLlngs, saveMissing, devMode", allLlngs, saveMissing, translationFetchMode);
        const lngs = allLlngs === "all" ? (await client.allLanguages()).map(ld => ld.key) : allLlngs;
        await i18nStore.initStore(lngs, nampespaces, fallbackLng, saveMissing, loadOnInit, client, missingKeyStorage);
        // if (saveMissing && onMissingKeyStrategy === OnMissingKeyStrategyImpl.upload) {
        //     setInterval(() => missingKeyStorage.pushMissingKeys(client!), 10000)
        // }
        return i18nStore;
    }
    NodokuI18n.initI18nStore = initI18nStore;
    function i18nForNodoku(store) {
        return async (lng) => {
            return { t: (text) => store.translateTranslatableText(lng, text) };
        };
    }
    NodokuI18n.i18nForNodoku = i18nForNodoku;
})(NodokuI18n || (NodokuI18n = {}));
