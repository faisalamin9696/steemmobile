import {LRUCache} from 'lru-cache';

let options = {
  max: 60,

  // for use with tracking overall storage size
  maxSize: 5000,
  sizeCalculation: (value, key) => {
    return 1;
  },

  // how long to live in ms
  ttl: 1000 * 60 * 5,

  // return stale items before removing from cache?
  allowStale: false,

  updateAgeOnGet: false,
  updateAgeOnHas: false,

  // async method to use for cache.fetch(), for
  // stale-while-revalidate type of behavior
  fetchMethod: async (key, staleValue, {options, signal}) => {},
};

const cache = new LRUCache(options);

export function setCacheSize(size: number): void {
  options.maxSize = size;
}

export function cacheGet<T extends unknown>(key: string): T {
  return cache.get(key) as T;
}

export function cacheSet(key: string, value: unknown): void {
  cache.set(key, value);
}
