export default {
    init() {
        this.root = document.getElementById('toast');
        this.timeout = null;
        return this;
    },

    up(input = 'Hey', type = 'info') {
        if (this.timeout) {
            clearTimeout(this.timeout);
            this.timeout = null;
        }

        this.root.innerHTML = '';

        const symbol = {
            info: 'info',
            success: 'check_circle',
            warning: 'warning',
            error: 'error',
        };

        this.root.innerHTML = `<div class="${type}"> 
            <span class="symbol"> ${symbol[type]} </span>
            <span class="content"> ${input} </span>
        </div>`;

        this.timeout = setTimeout(() => {
            this.root.innerHTML = '';
            this.timeout = null;
        }, 3000);
    },

    clear() {
        if (this.timeout) {
            clearTimeout(this.timeout);
            this.timeout = null;
        }
        this.root.innerHTML = '';
    }
};