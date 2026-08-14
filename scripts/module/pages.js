export default {
    init() {
        this.root = document.getElementById('pages');
        this.target = new EventTarget();
        this.history = []; 
        this.currentIndex = -1; 
        
        
        window.addEventListener('popstate', (e) => {
            const pageName = e.state;
            if (pageName) {
                
                const index = this.history.indexOf(pageName);
                if (index !== -1) {
                    this.currentIndex = index;
                    this.open(pageName, false, true);
                }
            }
        });
        
        return this;
    },
    
    open(name, history = true, isBack = false) {
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
            
            if (this.currentIndex < this.history.length - 1) {

                this.history = this.history.slice(0, this.currentIndex + 1);
            }
            this.history.push(name);
            this.currentIndex = this.history.length - 1;
            window.history.pushState(name, '');
        } else if (!history && !isBack) {
            if (this.history.length === 0) {
                this.history.push(name);
                this.currentIndex = 0;
            }
        }
        
        this.current = name;
        
        const eventType = isBack ? 'back' : 'open';
        this.target.dispatchEvent(
            new CustomEvent(eventType, {
                detail: {
                    name,
                    history: this.history,
                    currentIndex: this.currentIndex,
                    isBack
                }
            })
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
    },
    
    set onback(callback) {
        this.target.addEventListener(
            'back',
            e => callback(e.detail)
        );
    },
    
    back() {
        if (this.currentIndex > 0) {
            this.currentIndex--;
            const prevPage = this.history[this.currentIndex];
            this.open(prevPage, true, true);
        }
        return this;
    },
    
    forward() {
        if (this.currentIndex < this.history.length - 1) {
            this.currentIndex++;
            const nextPage = this.history[this.currentIndex];
            this.open(nextPage, true, true);
        }
        return this;
    },
    
    getHistory() {
        return [...this.history];
    },
    
    getPrevious() {
        return this.currentIndex > 0 ? this.history[this.currentIndex - 1] : null;
    },
    
    getNext() {
        return this.currentIndex < this.history.length - 1 ?
            this.history[this.currentIndex + 1] : null;
    }
};