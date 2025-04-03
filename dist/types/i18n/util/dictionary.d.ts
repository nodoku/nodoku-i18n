export type UpdatedKey = {
    language: string;
    namespace: string;
    key: string;
};
export type TranslationKey = {
    namespace: string;
    key: string;
};
export interface UpdatingValue {
    updKey: UpdatedKey;
    text: string;
}
export declare class Dictionary<K, V> {
    private internalMap;
    get(k: K): V | undefined;
    set(k: K, v: V): void;
    has(k: K): boolean;
    size(): number;
    delete(k: K): boolean;
    keys(): K[];
    values(): V[];
    entries(): [K, V][];
}
