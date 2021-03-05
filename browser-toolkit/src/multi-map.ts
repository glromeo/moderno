
export class MultiMap<K, V> extends Map<K, Set<V>> {

    add(key: K, value: V): MultiMap<K, V> {
        let set = super.get(key);
        if (!set) {
            set = new Set<V>();
            super.set(key, set);
        }
        set.add(value);
        return this;
    }

    remove(key: K, value: V): MultiMap<K, V> {
        let set = super.get(key);
        if (set) {
            set.delete(value);
            if (!set.size) {
                super.delete(key);
            }
        }
        return this;
    }
}
