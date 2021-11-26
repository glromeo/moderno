export declare class MultiMap<K, V> extends Map<K, Set<V>> {
    add(key: K, value: V): MultiMap<K, V>;
    remove(key: K, value: V): MultiMap<K, V>;
}
