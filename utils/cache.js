const cache = new Map();

export default {
    get: (key) => {
        const cached = cache.get(key);
        if (!cached) return null;

        const { expires, data } = cached;
        if (Date.now() > expires) {
            cache.delete(key);
            return null;
        }
        return data;
    },
    set: (key, data, ttlSeconds) => {
        const expires = Date.now() + ttlSeconds * 1000;
        cache.set(key, { data, expires });
    },
};
