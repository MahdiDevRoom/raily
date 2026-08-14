export default {
    init() {
        this.root = document.getElementById('pages');
        this.target = new EventTarget();
        return this;
    },

    open(name, history = true) {
        const target =
            this.root.querySelector(`[data-page="${name}"]`);

        if (!target) return this;

        this.root
            .querySelectorAll('[data-page]')
            .forEach(page => {
                page.classList.toggle(
                    'active',
                    page === target
                );
            });

        if (history && this.current !== name) {
            window.history.pushState(name, '');
        }

        this.current = name;

        this.target.dispatchEvent(
            new CustomEvent('open', { detail: name })
        );

        window.scrollTo({
            top: 0,
            behavior: 'smooth'
        });

        return this;
    },

    set onopen(callback) {
        this.target.addEventListener(
            'open',
            e => callback(e.detail)
        );
    }
};