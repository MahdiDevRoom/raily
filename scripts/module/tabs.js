export default {
    init() {
        this.root = document.getElementById('tabs');
        this.target = new EventTarget();
        return this;
    },

    open(name) {
        const tabs = this.root.querySelectorAll('[data-tab]');

        tabs.forEach(tab => {
            tab.classList.toggle(
                'active',
                tab.dataset.tab === name
            );
        });

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