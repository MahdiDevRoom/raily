export default {
    init() {
        this.root = document.getElementById('navbar');
        this.target = new EventTarget();
        this.navs = this.root.querySelectorAll('[data-nav]');

        this.navs.forEach(nav => {
            nav.onclick = () => {
                const navName = nav.dataset.nav;
                this.nav(navName);
                this.dispatchEvent('open', navName);
            };
        });

        return this;
    },

    nav(name) {
        this.current = name;
        this.navs.forEach(nav => {
            nav.classList.toggle('active', nav.dataset.nav === name);
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