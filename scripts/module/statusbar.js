export default {
    async init(color = 'surface') {
        this.meta = document.querySelector(
            'meta[name="theme-color"]'
        );

        this.color = color;
        this.theme = 'auto';

        await this.load();

        return this;
    },

    async load() {
        const db = localforage.createInstance({
            name: 'RailyDB',
            storeName: 'settings'
        });

        const settings =
            await db.getItem('settings') || {};

        this.theme = settings.theme || 'auto';

        await this.set(this.color);
    },

    async set(variable) {
        this.color = variable;

        let value = getComputedStyle(
            document.documentElement
        )
            .getPropertyValue(`--${variable}`)
            .trim();

        value = this.resolveLightDark(value);

        if (this.meta) {
            this.meta.setAttribute('content', value);
        }

        return value;
    },

    resolveLightDark(value) {
        const match = value.match(
            /light-dark\(([^,]+),\s*([^)]+)\)/
        );

        if (!match) return value;

        const light = match[1].trim();
        const dark = match[2].trim();

        if (this.theme === 'dark') {
            return dark;
        }

        if (this.theme === 'light') {
            return light;
        }

        return window.matchMedia(
            '(prefers-color-scheme: dark)'
        ).matches
            ? dark
            : light;
    },

    async reload() {
        await this.load();
        return this;
    }
};