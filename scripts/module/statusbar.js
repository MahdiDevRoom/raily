export default {
    async init(color = 'surface') {
        this.meta = document.querySelector(
            'meta[name="theme-color"]'
        );
        
        this.color = color;
        this.theme = 'auto';
        
        this.media = window.matchMedia(
            '(prefers-color-scheme: dark)'
        );
        
        this._bindSystemTheme();
        
        await this.load();
        
        return this;
    },
    
    _bindSystemTheme() {
        this._systemThemeChange = () => {
            if (this.theme === 'auto') {
                this.set(this.color);
            }
        };
        
        this.media.addEventListener(
            'change',
            this._systemThemeChange
        );
    },
    
    async load() {
        const db = localforage.createInstance({
            name: 'RailyDB',
            storeName: 'settings'
        });
        
        const settings =
            await db.getItem('settings') || {};
        
        this.theme = settings.theme || 'auto';
        
        return this.set(this.color);
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
            this.meta.setAttribute(
                'content',
                value
            );
        }
        
        return value;
    },
    
    resolveLightDark(value) {
        const match = value.match(
            /light-dark\(([^,]+),\s*([^)]+)\)/
        );
        
        if (!match) {
            return value;
        }
        
        const light = match[1].trim();
        const dark = match[2].trim();
        
        if (this.theme === 'dark') {
            return dark;
        }
        
        if (this.theme === 'light') {
            return light;
        }
        
        return this.media.matches ?
            dark :
            light;
    },
    
    async reload() {
        return this.load();
    }
};