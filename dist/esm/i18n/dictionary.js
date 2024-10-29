var Dictionary = /** @class */ (function () {
    function Dictionary() {
        this.internalMap = new Map();
    }
    Dictionary.prototype.get = function (k) {
        return this.internalMap.get(JSON.stringify(k));
    };
    Dictionary.prototype.set = function (k, v) {
        this.internalMap.set(JSON.stringify(k), v);
    };
    Dictionary.prototype.has = function (k) {
        return this.internalMap.has(JSON.stringify(k));
    };
    Dictionary.prototype.size = function () {
        return this.internalMap.size;
    };
    Dictionary.prototype.delete = function (k) {
        return this.internalMap.delete(JSON.stringify(k));
    };
    Dictionary.prototype.keys = function () {
        return Array.from(this.internalMap.keys()).map(function (k) { return JSON.parse(k); });
    };
    Dictionary.prototype.values = function () {
        return Array.from(this.internalMap.values());
    };
    Dictionary.prototype.entries = function () {
        return Array.from(this.internalMap.entries()).map(function (v) { return [JSON.parse(v[0]), v[1]]; });
    };
    return Dictionary;
}());
export { Dictionary };
//# sourceMappingURL=dictionary.js.map