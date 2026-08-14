import THEME from './theme.js'

export default {
    init(color) {
        this.meta = document.querySelector('meta[name="theme-color"]');
        this.color = color;
        this.set(this.color);
        THEME.onChange(() => this.reload());
    },

    set(variable) {
        this.color = variable;
        const computedStyle = getComputedStyle(document.documentElement);
        let colorValue = computedStyle.getPropertyValue(`--${variable}`).trim();

        if (colorValue.includes('light-dark')) {
            colorValue = this.resolveLightDark(colorValue);
        }

        if (this.meta) {
            this.meta.setAttribute('content', colorValue);
        }
    },

    resolveLightDark(value) {
        const match = value.match(/light-dark\(([^,]+),\s*([^)]+)\)/);
        if (!match) return value;

        const lightColor = match[1].trim();
        const darkColor = match[2].trim();

        const isDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        const isLight = window.matchMedia('(prefers-color-scheme: light)').matches;

        if (THEME.theme === 'dark' || (THEME.theme === 'auto' && isDark)) {
            return darkColor;
        } else if (THEME.theme === 'light' || (THEME.theme === 'auto' && isLight)) {
            return lightColor;
        }

        return lightColor;
    },

    reload() {
        this.set(this.color);
    }
}