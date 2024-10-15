export declare const apiKey: string;
export declare function onFallbackLanguageValueChange(language: string, namespace: string, key: string, text: string): void;
declare function missingKeyHandler(languages: readonly string[], namespace: string, key: string, fallbackValue: string): void;
export declare function getOptions(lng: string, ns: string, fallbackLng: string): {
    fallbackLng: string;
    supportedLngs: string[];
    lng: string;
    ns: string;
    saveMissing: boolean;
    missingKeyHandler: typeof missingKeyHandler;
};
export {};
