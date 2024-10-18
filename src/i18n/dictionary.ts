import {pick} from "next/dist/lib/pick";

export class Dictionary<K, V> {

    private internalMap: Map<string, V> = new Map<string, V>();


    get(k: K): V | undefined{
        return this.internalMap.get(JSON.stringify(k))
    }

    set(k: K, v: V): void {
        this.internalMap.set(JSON.stringify(k), v);
    }

    has(k: K): boolean {
        return this.internalMap.has(JSON.stringify(k))
    }

    size(): number {
        return this.internalMap.size;
    }

    delete(k: K): boolean {
        return this.internalMap.delete(JSON.stringify(k))
    }

    keys(): K[] {
        return Array.from(this.internalMap.keys()).map(k => JSON.parse(k) as K);
    }

    values(): V[] {
        return Array.from(this.internalMap.values());
    }

    entries(): [K, V][] {
        return Array.from(this.internalMap.entries()).map((v: [string, V]) => [JSON.parse(v[0]) as K, v[1]]);
    }

}