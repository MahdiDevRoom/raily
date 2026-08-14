export default {
    init() {
        this.root = document.getElementById('tabbar');
        this.target = new EventTarget();
        this.tabs = this.root.querySelectorAll('[data-tab]');

        this.tabs.forEach(tab => {
            tab.onclick = () => {
                const tabName = tab.dataset.tab;
                this.tab(tabName);
                this.dispatchEvent('open', tabName);
            };
        });

        return this;
    },

    tab(name) {
        this.current = name;
        this.tabs.forEach(tab => {
            tab.classList.toggle('active', tab.dataset.tab === name);
        });
        this.dispatchEvent('open', name);
        return this;
    },

    getActive() {
        return this.current || null;
    },

    dispatchEvent(name, detail = {}) {
        this.target.dispatchEvent(new CustomEvent(name, { detail }));
    },

    set onopen(callback) {
        this.target.addEventListener('open', (e) => callback(e.detail));
    },
};