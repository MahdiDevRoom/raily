export default {
    init() {
        this.root = document.getElementById('navbar');
        this.target = new EventTarget();
        this.navs = this.root.querySelectorAll('[data-nav]');

        this.navs.forEach(nav => {
            nav.onclick = () => {
                this.nav(nav.dataset.nav);
            };
        });

        return this;
    },

    nav(name) {
        this.current = name;

        this.navs.forEach(nav => {
            nav.classList.toggle(
                'active',
                nav.dataset.nav === name
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