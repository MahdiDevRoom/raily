export default {
    init() {
        this.root = document.getElementById('tabbar');
        this.target = new EventTarget();
        this.tabs = this.root.querySelectorAll('[data-tab]');

        this.tabs.forEach(tab => {
            tab.onclick = () => {
                this.tab(tab.dataset.tab);
            };
        });

        return this;
    },

    tab(name) {
        this.current = name;

        this.tabs.forEach(tab => {
            tab.classList.toggle(
                'active',
                tab.dataset.tab === name
            );
        });

        this.target.dispatchEvent(
            new CustomEvent('open', { detail: name })
        );

        return this;
    },

    getActive() {
        return this.current || null;
    },

    set onopen(callback) {
        this.target.addEventListener(
            'open',
            e => callback(e.detail)
        );
    }
};