import DATEPICKER from "./datepicker.js";
import NAVBAR from "./navbar.js";
import SWITCH from "./switch.js";
import TOAST from "./toast.js";

export default {
    async init() {
        this.elements = {
            title: document.getElementById("task-form-title"),
            note: document.getElementById("task-form-note"),
            date: document.getElementById("task-form-date"),
            dateButton: document.getElementById("task-form-date-button"),
            submit: document.getElementById("task-form-submit")
        };

        this.priority = new SWITCH("label-switch");
        this.categories = new SWITCH("category-switch", true);
        this.target = new EventTarget();

        this.store = localforage.createInstance({
            name: "RailyDB",
            storeName: "tasks"
        });

        this._setDefaultDate();
        this._bindEvents();

        return this;
    },

    _setDefaultDate() {
        const date = new Intl.DateTimeFormat("fa-IR", {
            year: "numeric",
            month: "2-digit",
            day: "2-digit",
            numberingSystem: "latn"
        }).format(new Date());

        this.elements.date.value = date;
    },

    _bindEvents() {
        this.elements.submit.onclick = () => this.submit();

        this.elements.dateButton.onclick = () => {
            this.elements.date.focus();
        };

        this.elements.date.onfocus = () => {
            DATEPICKER.open(date => {
                this.elements.date.value = date;
            });
        };

        this.elements.title.addEventListener("keydown", e => {
            if (e.key === "Enter") {
                e.preventDefault();
                this.submit();
            }
        });

        this.elements.note.addEventListener("keydown", e => {
            if (e.key === "Enter" && e.ctrlKey) {
                e.preventDefault();
                this.submit();
            }
        });
    },

    async _getTasks() {
        return (await this.store.getItem("tasks")) || [];
    },

    async _saveTasks(tasks) {
        await this.store.setItem("tasks", tasks);
    },

    _getData() {
        const categories = this.categories.getActive();

        return {
            title: this.elements.title.value.trim(),
            category: categories.length ? categories : ["other"],
            note: this.elements.note.value.trim(),
            date: this.elements.date.value,
            priority: this.priority.getActive() || "none"
        };
    },

    _validate(data) {
        this.elements.title.classList.remove("error");
        this.elements.date.classList.remove("error");

        if (!data.title) {
            this.elements.title.classList.add("error");
            this.elements.title.focus();
            return "عنوان فعالیت الزامی است";
        }

        if (!data.date) {
            this.elements.date.classList.add("error");
            return "تاریخ الزامی است";
        }

        return null;
    },

    async submit() {
        const data = this._getData();
        const error = this._validate(data);

        if (error) {
            TOAST.up(error, "warning");
            return;
        }

        try {
            const tasks = await this._getTasks();
            const now = new Date().toISOString();

            const newTask = {
                id: Date.now(),
                ...data,
                completed: false,
                createdAt: now,
                updatedAt: now
            };

            tasks.push(newTask);

            await this._saveTasks(tasks);

            TOAST.up("فعالیت با موفقیت ثبت شد", "success");

            this.reset();

            NAVBAR.nav("home");

            this._dispatchEvent("success", newTask);
        } catch (error) {
            console.error(error);
            TOAST.up("خطا در ثبت فعالیت", "error");
            this._dispatchEvent("error", error);
        }
    },

    reset() {
        this.elements.title.value = "";
        this.elements.note.value = "";
        this.elements.title.classList.remove("error");
        this.elements.date.classList.remove("error");

        this._setDefaultDate();

        this.priority.active("none");
        this.categories.setChecked(["other"]);

        this.elements.title.focus();
    },

    fill(data) {
        if (!data) return;

        this.elements.title.value = data.title || "";
        this.elements.note.value = data.note || "";
        this.elements.date.value = data.date || "";

        if (data.priority) {
            this.priority.active(data.priority);
        }

        if (data.category) {
            const categories = Array.isArray(data.category)
                ? data.category
                : [data.category];

            this.categories.setChecked(categories);
        }
    },

    _dispatchEvent(name, detail = {}) {
        this.target.dispatchEvent(
            new CustomEvent(name, { detail })
        );
    },

    set onsuccess(callback) {
        this.target.addEventListener("success", e => {
            callback(e.detail);
        });
    },

    set onerror(callback) {
        this.target.addEventListener("error", e => {
            callback(e.detail);
        });
    }
};