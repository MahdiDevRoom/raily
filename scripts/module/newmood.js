import DATEPICKER from "./datepicker.js";
import NAVBAR from "./navbar.js";
import SWITCH from "./switch.js";
import TOAST from "./toast.js";

export default {
    async init() {
        this.elements = {
            note: document.getElementById("mood-form-note"),
            date: document.getElementById("mood-form-date"),
            dateButton: document.getElementById("mood-form-date-button"),
            submit: document.getElementById("mood-form-submit")
        };

        this.mood = new SWITCH("mood-switch");

        this.currentId = null;

        this.target = new EventTarget();

        this.store = localforage.createInstance({
            name: "RailyDB",
            storeName: "moods"
        });

        this._setDefaultDate();

        await this._checkDate();

        this._bindEvents();

        return this;
    },

    _getToday() {
        return new Intl.DateTimeFormat("fa-IR", {
            year: "numeric",
            month: "2-digit",
            day: "2-digit",
            numberingSystem: "latn"
        }).format(new Date());
    },

    _setDefaultDate() {
        this.elements.date.value = this._getToday();
    },

    async _getMoods() {
        return (await this.store.getItem("moods")) || [];
    },

    async _saveMoods(moods) {
        await this.store.setItem("moods", moods);
    },

    async _checkDate() {
        const date = this.elements.date.value;
        const moods = await this._getMoods();

        const mood = moods.find(item => item.date === date);

        if (mood) {
            this.elements.note.value = mood.note || "";

            this.mood.active(mood.mood || "okay");

            this.currentId = mood.id;

            this._setSubmitMode("edit");
        } else {
            this.currentId = null;

            this.elements.note.value = "";

            this.mood.active("okay");

            this._setSubmitMode("add");
        }
    },

    _setSubmitMode(mode) {
        this.elements.submit.textContent =
            mode === "edit"
                ? "ویرایش مود"
                : "ذخیره";
    },

    _bindEvents() {
        this.elements.submit.onclick = () => {
            this.submit();
        };

        this.elements.dateButton.onclick = () => {
            this.elements.date.focus();
        };

        this.elements.date.onfocus = () => {
            DATEPICKER.open(date => {
                if (typeof date === "string") {
                    this.elements.date.value = date;
                } else if (date?.formatted) {
                    this.elements.date.value = date.formatted;
                } else if (date?.jalali) {
                    this.elements.date.value = date.jalali;
                }

                this._checkDate();
            });
        };

        this.elements.date.onchange = () => {
            this._checkDate();
        };

        this.elements.note.addEventListener("keydown", event => {
            if (event.key === "Enter") {
                event.preventDefault();

                this.submit();
            }
        });
    },

    _getData() {
        return {
            mood: this.mood.getActive() || "okay",
            note: this.elements.note.value.trim(),
            date: this.elements.date.value
        };
    },

    _validate(data) {
        this.elements.date.classList.remove("error");

        if (!data.date) {
            this.elements.date.classList.add("error");

            return "تاریخ الزامی است";
        }

        return null;
    },

    _dispatchEvent(name, detail = {}) {
        this.target.dispatchEvent(
            new CustomEvent(name, { detail })
        );
    },

    async submit() {
        const data = this._getData();

        const error = this._validate(data);

        if (error) {
            TOAST.up(error, "warning");


            return;
        }

        try {
            const moods = await this._getMoods();

            const now = new Date().toISOString();

            const editingId = this.currentId;

            let result;
            let mode;

            /*
             * ویرایش مود موجود
             */
            if (editingId !== null && editingId !== undefined) {
                const index = moods.findIndex(
                    mood => mood.id === editingId
                );

                /*
                 * اگر رکورد پیدا شد، ویرایشش می‌کنیم
                 */
                if (index !== -1) {
                    result = {
                        ...moods[index],
                        ...data,
                        updatedAt: now
                    };

                    moods[index] = result;

                    mode = "edit";
                }

                /*
                 * اگر currentId وجود داشت ولی رکورد پیدا نشد،
                 * به جای crash کردن، یک مود جدید می‌سازیم.
                 */
                else {
                    result = {
                        id: Date.now(),
                        ...data,
                        createdAt: now,
                        updatedAt: now
                    };

                    moods.push(result);

                    mode = "add";
                }
            }

            /*
             * ثبت مود جدید
             */
            else {
                result = {
                    id: Date.now(),
                    ...data,
                    createdAt: now,
                    updatedAt: now
                };

                moods.push(result);

                mode = "add";
            }

            await this._saveMoods(moods);

            /*
             * ID رکورد ذخیره‌شده
             */
            this.currentId = result.id;

            /*
             * دکمه بعد از ذخیره تبدیل به ویرایش شود
             */
            this._setSubmitMode("edit");

            /*
             * پیام مناسب
             */
            TOAST.up(
                mode === "edit"
                    ? "مود با موفقیت ویرایش شد"
                    : "مود با موفقیت ثبت شد",
                "success"
            );

            this._dispatchEvent("success", result);

            /*
             * برگشت به خانه
             */
            NAVBAR.nav("home");

        } catch (error) {
            console.error(error);

            TOAST.up(
                "خطا در ثبت مود",
                "error"
            );


            this._dispatchEvent(
                "error",
                error
            );
        }
    },

    reset() {
        this.elements.note.value = "";

        this.elements.date.classList.remove("error");

        this._setDefaultDate();

        this.mood.active("okay");

        this.currentId = null;

        this._setSubmitMode("add");

        this.elements.note.focus();
    },

    fill(data) {
        if (!data) return;

        this.elements.note.value = data.note || "";

        this.elements.date.value =
            data.date || this._getToday();

        if (data.mood) {
            this.mood.active(data.mood);
        }

        if (data.id !== undefined) {
            this.currentId = data.id;

            this._setSubmitMode("edit");
        }
    },

    set onsuccess(callback) {
        this.target.addEventListener(
            "success",
            event => callback(event.detail)
        );
    },

    set onerror(callback) {
        this.target.addEventListener(
            "error",
            event => callback(event.detail)
        );
    }
};