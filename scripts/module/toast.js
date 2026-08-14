export default {
    init() {
        this.root =
            document.getElementById("toast");

        this.timer = null;

        return this;
    },

    up(message, type = "info") {
        if (!this.root) {
            this.root =
                document.getElementById("toast");
        }

        if (!this.root) return;

        clearTimeout(this.timer);

        const icons = {
            info: "info",
            success: "check_circle",
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

        this.root.innerHTML = "";

        const toast =
            document.createElement("div");

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
        }, 3000);
    },

    hide() {
        clearTimeout(this.timer);

        if (!this.root) return;

        this.root.innerHTML = "";
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