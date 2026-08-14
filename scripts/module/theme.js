export default {
    init() {
        this.root = document.documentElement;
        this.storage = 'raily-theme';
        this.target = new EventTarget();

        let current = localStorage.getItem(this.storage);

        if (!current) {
            current = 'auto';
            localStorage.setItem(this.storage, current);
        }

        this.theme = current;
        this.root.setAttribute('data-theme', current);
    },

    set(theme) {
        this.theme = theme;
        localStorage.setItem(this.storage, theme);
        this.root.setAttribute('data-theme', theme);
        this.target.dispatchEvent(new CustomEvent('themeChange', { detail: theme }));
    },

    isAuto() {
        return this.theme == 'auto';
    },
    isLight() {
        return this.theme == 'light';
    },
    isDark() {
        return this.theme == 'dark';
    },

    onChange(callback) {
        this.target.addEventListener('themeChange', (e) => callback(e.detail));
    },

    offChange(callback) {
        this.target.removeEventListener('themeChange', callback);
    }
}