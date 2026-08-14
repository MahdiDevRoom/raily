import STATUSBAR from "./statusbar.js"

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

        const data = {
            info: ['info', 'primary-container'],
            success: ['check_circle', 'success'],
            warning: ['warning', 'warning'],
            error: ['error', 'error'],
        };

        this.root.innerHTML = `<div class="${type}"> 
            <span class="symbol"> ${data[type][0]} </span>
            <span class="content"> ${input} </span>
        </div>`;

        STATUSBAR.resolveLightDark(data[type][1])

        this.timeout = setTimeout(() => {
            this.root.innerHTML = '';
            STATUSBAR.resolveLightDark('surface')
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