export default class {
    constructor(root, checkbox = false) {
        this.root = document.getElementById(root);
        this.target = new EventTarget();
        this.checkbox = checkbox;
        this.current = checkbox ? [] : null;
        this.items = [];

        if (!this.root) return;

        this.refresh();
        this.initEvents();
        this.initActive();
    }

    refresh() {
        this.items = this.root.querySelectorAll('[data-case]');
        return this;
    }

    initEvents() {
        this.items.forEach(item => {
            item.onclick = () => {
                this.handleClick(item);
            };
        });
    }

    handleClick(item) {
        const name = item.dataset.case;

        if (this.checkbox) {
            this.toggleCheckbox(name);
            this.emit('case', this.current);
            return;
        }

        this.active(name);
    }

    toggleCheckbox(name) {
        const index = this.current.indexOf(name);
        const item = this.findItem(name);

        if (index === -1) {
            this.current.push(name);
            item?.classList.add('active');
        } else {
            this.current.splice(index, 1);
            item?.classList.remove('active');
        }
    }

    initActive() {
        if (this.checkbox) {
            this.current = [...this.items]
                .filter(item => item.classList.contains('active'))
                .map(item => item.dataset.case);

            return;
        }

        const active = this.root.querySelector('.active');

        if (active) {
            this.current = active.dataset.case;
            return;
        }

        const first = this.items[0];

        if (first) {
            first.classList.add('active');
            this.current = first.dataset.case;
        }
    }

    findItem(name) {
        return this.root.querySelector(
            `[data-case="${CSS.escape(name)}"]`
        );
    }

    active(name) {
        if (this.checkbox || !this.findItem(name)) {
            return this;
        }

        this.current = name;

        this.items.forEach(item => {
            item.classList.toggle(
                'active',
                item.dataset.case === name
            );
        });

        this.emit('case', name);

        return this;
    }

    getActive() {
        if (this.checkbox) {
            return [...this.current];
        }

        return this.current;
    }

    hasCase(name) {
        return !!name && !!this.findItem(name);
    }

    isChecked(name) {
        if (!name) return false;

        return this.checkbox
            ? this.current.includes(name)
            : this.current === name;
    }

    addCase(name, label = null) {
        if (!name || this.hasCase(name)) {
            return this;
        }

        const item = document.createElement('div');

        item.dataset.case = name;
        item.textContent = label || name;
        item.onclick = () => this.handleClick(item);

        this.root.appendChild(item);

        this.refresh();

        this.emit('add', name);

        return this;
    }

    removeCase(name) {
        if (!name) return this;

        const item = this.findItem(name);

        if (!item) return this;

        if (this.checkbox) {
            this.current = this.current.filter(
                value => value !== name
            );
        } else if (this.current === name) {
            this.current = null;
        }

        item.remove();
        this.refresh();

        this.emit('remove', name);

        return this;
    }

    clearCases() {
        this.items.forEach(item => item.remove());

        this.items = [];
        this.current = this.checkbox ? [] : null;

        this.emit('clear');

        return this;
    }

    toggle(name) {
        if (!this.checkbox || !this.hasCase(name)) {
            return this;
        }

        this.toggleCheckbox(name);
        this.emit('case', this.current);

        return this;
    }

    setChecked(names = []) {
        if (!this.checkbox) return this;

        this.current = [];

        this.items.forEach(item => {
            item.classList.remove('active');
        });

        names.forEach(name => {
            const item = this.findItem(name);

            if (!item) return;

            item.classList.add('active');
            this.current.push(name);
        });

        this.emit('case', this.current);

        return this;
    }

    emit(name, detail = null) {
        this.target.dispatchEvent(
            new CustomEvent(name, { detail })
        );
    }

    on(event, callback) {
        this.target.addEventListener(
            event,
            e => callback(e.detail)
        );

        return this;
    }

    set case(callback) {
        this.on('case', callback);
    }

    set onadd(callback) {
        this.on('add', callback);
    }

    set onremove(callback) {
        this.on('remove', callback);
    }

    set onclear(callback) {
        this.on('clear', callback);
    }
}