export default class {
    constructor(root, checkbox = false) {
        this.root = document.getElementById(root);
        this.target = new EventTarget();
        this.checkbox = checkbox;
        if (!this.root) {
            console.warn(`Element with id "${root}" not found`);
            return;
        }
        this.items = this.root.querySelectorAll('[data-case]');
        if (this.checkbox) {
            this.current = [];
            this.items.forEach(item => {
                if (item.classList.contains('active')) {
                    this.current.push(item.dataset.case);
                }
                
                item.onclick = () => {
                    const caseName = item.dataset.case;
                    const index = this.current.indexOf(caseName);
                    
                    if (index > -1) {
                        this.current.splice(index, 1);
                        item.classList.remove('active');
                    } else {
                        this.current.push(caseName);
                        item.classList.add('active');
                    }
                    
                    this.dispatchEvent('case', this.current);
                };
            });
        }
        else {
            this.current = null;
            this.items.forEach(item => {
                item.onclick = () => {
                    this.dispatchEvent('case', item.dataset.case);
                    this.active(item.dataset.case);
                };
            });

            const hasActive = this.root.querySelector('.active');
            if (!hasActive && this.items.length > 0) {
                this.items[0].classList.add('active');
                this.current = this.items[0].dataset.case;
            }
        }
    }

    active(name) {
        if (this.checkbox) return this;
        
        this.current = name;
        this.items.forEach(item => item.classList.toggle('active', item.dataset.case === name));
        this.dispatchEvent('case', name);
        return this;
    }
    getActive() {
        if (this.checkbox) {
            return this.current || [];
        }
        
        if (this.current) return this.current;
        
        const active = this.root?.querySelector('.active');
        return active ? active.dataset.case : null;
    }
    hasCase(name) {
        if (!name) return false;
        return this.root?.querySelector(`[data-case="${name}"]`) !== null;
    }
    isChecked(name) {
        if (!this.checkbox) return this.current === name;
        return this.current.includes(name);
    }
    addCase(name, label = null) {
        if (!name) return this;
        if (this.hasCase(name)) return this;

        const item = document.createElement('div');
        item.dataset.case = name;
        item.innerText = label || name;
        
        if (this.checkbox) {
            item.onclick = () => {
                const caseName = item.dataset.case;
                const index = this.current.indexOf(caseName);
                
                if (index > -1) {
                    this.current.splice(index, 1);
                    item.classList.remove('active');
                } else {
                    this.current.push(caseName);
                    item.classList.add('active');
                }
                
                this.dispatchEvent('case', this.current);
            };
        } else {
            item.onclick = () => {
                this.dispatchEvent('case', item.dataset.case);
                this.active(item.dataset.case);
            };
        }

        this.root.appendChild(item);
        this.items = this.root.querySelectorAll('[data-case]');
        
        this.dispatchEvent('add', name);
        return this;
    }
    removeCase(name) {
        if (!name) return this;
        
        const item = this.root.querySelector(`[data-case="${name}"]`);
        if (!item) return this;

        if (this.checkbox) {
            const index = this.current.indexOf(name);
            if (index > -1) {
                this.current.splice(index, 1);
            }
        }

        item.remove();
        this.items = this.root.querySelectorAll('[data-case]');

        if (!this.checkbox && this.current === name) {
            this.current = null;
        }

        this.dispatchEvent('remove', name);
        return this;
    }
    clearCases() {
        this.items.forEach(item => item.remove());
        this.items = [];
        this.current = this.checkbox ? [] : null;
        this.dispatchEvent('clear', null);
        return this;
    }
    toggle(name) {
        if (!this.checkbox) return this;
        
        const index = this.current.indexOf(name);
        const item = this.root.querySelector(`[data-case="${name}"]`);
        
        if (index > -1) {
            this.current.splice(index, 1);
            if (item) item.classList.remove('active');
        } else {
            this.current.push(name);
            if (item) item.classList.add('active');
        }
        
        this.dispatchEvent('case', this.current);
        return this;
    }
    setChecked(names) {
        if (!this.checkbox) return this;
        
        this.items.forEach(item => item.classList.remove('active'));
        this.current = [];
        
        names.forEach(name => {
            const item = this.root.querySelector(`[data-case="${name}"]`);
            if (item) {
                item.classList.add('active');
                this.current.push(name);
            }
        });
        
        this.dispatchEvent('case', this.current);
        return this;
    }
    dispatchEvent(name, detail = {}) {
        this.target.dispatchEvent(new CustomEvent(name, { detail }));
    }
    set case(callback) {
        this.target.addEventListener('case', (e) => callback(e.detail));
    }
    set onadd(callback) {
        this.target.addEventListener('add', (e) => callback(e.detail));
    }
    set onremove(callback) {
        this.target.addEventListener('remove', (e) => callback(e.detail));
    }
    set onclear(callback) {
        this.target.addEventListener('clear', (e) => callback(e.detail));
    }
}