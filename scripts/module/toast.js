import STATUSBAR from "./statusbar.js";

export default {
    init() {
        this.root = document.getElementById("toast");
        this.timer = null;
        
        return this;
    },
    
    up(message, type = "info") {
        if (!this.root) {
            this.root = document.getElementById("toast");
        }
        
        if (!this.root) return;
        
        clearTimeout(this.timer);
        
        const icons = {
            info: "info",
            success: "check_circle",
            warning: "warning",
            error: "error"
        };
        
        const colors = {
            info: "primary-container",
            success: "success",
            warning: "warning",
            error: "error"
        };
        
        const types = [
            "info",
            "success",
            "warning",
            "error"
        ];
        
        if (!types.includes(type)) {
            type = "info";
        }
        
        /*
         * تغییر رنگ Statusbar
         */
        STATUSBAR.set(colors[type]);
        
        this.root.innerHTML = "";
        
        const toast = document.createElement("div");
        
        toast.className = type;
        
        toast.innerHTML = `
            <span class="symbol">
                ${icons[type]}
            </span>

            <div class="content">
                ${this._escape(message)}
            </div>
        `;
        
        this.root.appendChild(toast);
        
        this.timer = setTimeout(() => {
            toast.remove();
            STATUSBAR.set("surface");
        }, 3000);
    },
    
    hide() {
        clearTimeout(this.timer);
        
        if (!this.root) return;
        
        this.root.innerHTML = "";
        
        STATUSBAR.set("surface");
    },
    
    _escape(value) {
        return String(value ?? "")
            .replaceAll("&", "&amp;")
            .replaceAll("<", "&lt;")
            .replaceAll(">", "&gt;")
            .replaceAll('"', "&quot;")
            .replaceAll("'", "&#039;");
    }
};