export class Dictionary {
    constructor() {
        this.internalMap = new Map();
    }
    get(k) {
        return this.internalMap.get(JSON.stringify(k));
    }
    set(k, v) {
        this.internalMap.set(JSON.stringify(k), v);
    }
    has(k) {
        return this.internalMap.has(JSON.stringify(k));
    }
    size() {
        return this.internalMap.size;
    }
    delete(k) {
        return this.internalMap.delete(JSON.stringify(k));
    }
    keys() {
        return Array.from(this.internalMap.keys()).map(k => JSON.parse(k));
    }
    values() {
        return Array.from(this.internalMap.values());
    }
    entries() {
        return Array.from(this.internalMap.entries()).map((v) => [JSON.parse(v[0]), v[1]]);
    }
}
