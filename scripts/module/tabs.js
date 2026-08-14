export default {
    init() {
        this.root = document.getElementById('tabs');
        this.target = new EventTarget();
    },

    open(name) {
        const target = this.root.querySelector(`[data-tab="${name}"]`);
        const allTabs = this.root.querySelectorAll('[data-tab]');

        if (target) {
            allTabs.forEach(elm => { if (elm.classList.contains('active')) elm.classList.remove('active') })
            if (!target.classList.contains('active')) target.classList.add('active')
        }

        this.dispatchEvent('open', name);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    },

    dispatchEvent(name, detail = {}) {
        this.target.dispatchEvent(new CustomEvent(name, { detail }));
    },

    set onopen(callback) {
        this.target.addEventListener('open', (e) => callback(e.detail));
    },
}
