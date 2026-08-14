export default {
    init() {
        this.root = document.getElementById('pages');
        this.target = new EventTarget();
    },

    open(name, addHistory = true) {
        const target = this.root.querySelector(`[data-page="${name}"]`);
        const allPages = this.root.querySelectorAll('[data-page]');

        if (target) {
            allPages.forEach(elm => { if (elm.classList.contains('active')) elm.classList.remove('active') })
            if (!target.classList.contains('active')) target.classList.add('active')
        }

        this.dispatchEvent('open', name);
        window.scrollTo({ top: 0, behavior: 'smooth' });

        if (addHistory && this.current !== name) history.pushState(name, "");
        this.current = name;
    },

    dispatchEvent(name, detail = {}) {
        this.target.dispatchEvent(new CustomEvent(name, { detail }));
    },

    set onopen(callback) {
        this.target.addEventListener('open', (e) => callback(e.detail));
    },
}
