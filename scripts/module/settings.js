import TOAST from "./toast.js";
import SWITCH from "./switch.js";
import DATEPICKER from "./datepicker.js";
import CONFIRM from "./confirm.js";

export default {
    async init() {
        this.elm = {
            root: document.documentElement,

            theme: new SWITCH("theme-switch"),

            name: document.getElementById("settings-form-name"),
            nameSave: document.getElementById(
                "dettings-form-name-save"
            ),
            nameRestore: document.getElementById(
                "dettings-form-name-restore"
            ),

            date: document.getElementById(
                "settings-form-date"
            ),
            dateButton: document.getElementById(
                "settings-form-date-button"
            ),

            resetSettings: document.getElementById(
                "reaset-settings"
            ),
            clearData: document.getElementById(
                "clear-data"
            ),
            resetAll: document.getElementById(
                "reaset-all"
            )
        };

        this.db = localforage.createInstance({
            name: "RailyDB",
            storeName: "settings"
        });

        this.target = new EventTarget();

        await this._loadSettings();
        this._setupEvents();

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

    async _loadSettings() {
        let settings = await this.db.getItem("settings");

        if (!settings || typeof settings !== "object") {
            settings = {
                name: "مهمان",
                theme: "auto",
                timeOffset: 0,
                customDate: null
            };

            await this._saveSettings(settings);
        }

        this.settings = settings;
        this.timeOffset =
            Number(settings.timeOffset) || 0;

        const theme = settings.theme || "auto";

        this.elm.root.setAttribute(
            "data-theme",
            theme
        );

        /*
         * اول مقدار Switch را تنظیم می‌کنیم.
         * این کار نباید پیام Toast تولید کند.
         */
        this.elm.theme.active(theme);

        this.elm.theme.case = newTheme =>
            this._changeTheme(newTheme);

        this.elm.name.value =
            settings.name || "مهمان";

        this.elm.date.value =
            settings.customDate || this._getToday();
    },

    async _changeTheme(theme) {
        if (!theme) return;

        /*
         * اگر همان تم فعلی است،
         * هیچ ذخیره و Toast اضافه‌ای انجام نده.
         */
        if (this.settings.theme === theme) {
            this.elm.root.setAttribute(
                "data-theme",
                theme
            );

            return;
        }

        const themes = {
            auto: "خودکار",
            light: "روشن",
            dark: "تیره"
        };

        if (!themes[theme]) return;

        const settings = {
            ...this.settings,
            theme
        };

        const saved = await this._saveSettings(
            settings
        );

        if (!saved) return;

        this.settings = settings;

        this.elm.root.setAttribute(
            "data-theme",
            theme
        );

        TOAST.up(
            `به ${themes[theme]} تغییر کرد`,
            "success"
        );

        this._dispatchEvent(
            "themeChange",
            theme
        );

        this._dispatchEvent(
            "change",
            this.settings
        );
    },

    _setupEvents() {

        // -----------------------------
        // Name
        // -----------------------------

        this.elm.nameSave?.addEventListener(
            "click",
            () => this._saveName()
        );

        this.elm.nameRestore?.addEventListener(
            "click",
            () => {
                this.elm.name.value =
                    this.settings.name || "مهمان";

                this.elm.name.classList.remove(
                    "error"
                );
            }
        );

        // -----------------------------
        // Date
        // -----------------------------

        this.elm.dateButton?.addEventListener(
            "click",
            () => {
                this.elm.date?.focus();
            }
        );

        this.elm.date?.addEventListener(
            "focus",
            () => {
                DATEPICKER.open(date => {
                    let value = null;

                    if (typeof date === "string") {
                        value = date;
                    } else if (date?.formatted) {
                        value = date.formatted;
                    } else if (date?.jalali) {
                        value = date.jalali;
                    }

                    if (!value) return;

                    this.elm.date.value = value;

                    this._setDateOffset(value);
                });
            }
        );

        // -----------------------------
        // Reset settings
        // -----------------------------

        this.elm.resetSettings?.addEventListener(
            "click",
            () => {
                CONFIRM.open({
                    title: "بازنشانی تنظیمات",
                    message:
                        "آیا از بازنشانی تنظیمات مطمئن هستید؟",
                    confirmText:
                        "بله، بازنشانی کن",
                    cancelText: "انصراف",

                    onConfirm: () =>
                        this._resetSettings()
                });
            }
        );

        // -----------------------------
        // Clear data
        // -----------------------------

        this.elm.clearData?.addEventListener(
            "click",
            () => {
                CONFIRM.open({
                    title: "پاک کردن همه اطلاعات",
                    message:
                        "همه فعالیت‌ها و مودها پاک خواهند شد.",
                    confirmText: "بله، پاک کن",
                    cancelText: "انصراف",

                    onConfirm: () =>
                        this._clearAllData()
                });
            }
        );

        // -----------------------------
        // Reset all
        // -----------------------------

        this.elm.resetAll?.addEventListener(
            "click",
            () => {
                CONFIRM.open({
                    title: "بازنشانی همه",
                    message:
                        "همه تنظیمات و اطلاعات پاک خواهند شد.",
                    confirmText:
                        "بله، بازنشانی کن",
                    cancelText: "انصراف",

                    onConfirm: () =>
                        this._resetAll()
                });
            }
        );
    },

    async _saveName() {
        const name =
            this.elm.name.value.trim();

        this.elm.name.classList.remove(
            "error"
        );

        if (!name) {
            this.elm.name.classList.add(
                "error"
            );

            TOAST.up(
                "نام را وارد کنید",
                "warning"
            );

            return;
        }

        const settings = {
            ...this.settings,
            name
        };

        const saved = await this._saveSettings(
            settings
        );

        if (!saved) return;

        this.settings = settings;

        TOAST.up(
            "نام با موفقیت ذخیره شد",
            "success"
        );

        this._dispatchEvent(
            "change",
            this.settings
        );
    },

    async _setDateOffset(persianDate) {
        if (!persianDate) return;

        const parts =
            persianDate.split("/").map(Number);

        if (
            parts.length !== 3 ||
            parts.some(Number.isNaN)
        ) {
            TOAST.up(
                "تاریخ نامعتبر است",
                "error"
            );

            return;
        }

        const [
            year,
            month,
            day
        ] = parts;

        const gregorian =
            DATEPICKER.jalaliToGregorian(
                year,
                month,
                day
            );

        if (!gregorian) {
            TOAST.up(
                "تبدیل تاریخ انجام نشد",
                "error"
            );

            return;
        }

        const target = new Date(
            gregorian.year,
            gregorian.month - 1,
            gregorian.day
        );

        const now = new Date();

        const today = new Date(
            now.getFullYear(),
            now.getMonth(),
            now.getDate()
        );

        const timeOffset =
            target.getTime() -
            today.getTime();

        const settings = {
            ...this.settings,
            timeOffset,
            customDate: persianDate
        };

        const saved = await this._saveSettings(
            settings
        );

        if (!saved) return;

        this.settings = settings;
        this.timeOffset = timeOffset;

        this.elm.date.value =
            persianDate;

        const days = Math.round(
            timeOffset / 86400000
        );

        let text;

        if (days > 0) {
            text = `${days} روز جلوتر`;
        } else if (days < 0) {
            text = `${Math.abs(days)} روز عقب‌تر`;
        } else {
            text = "همان روز";
        }

        TOAST.up(
            `تاریخ برنامه ${text} شد`,
            "success"
        );

        this._dispatchEvent(
            "change",
            this.settings
        );
    },

    async _resetSettings() {
        const settings = {
            name: "مهمان",
            theme: "auto",
            timeOffset: 0,
            customDate: null
        };

        const saved = await this._saveSettings(
            settings
        );

        if (!saved) return;

        this.settings = settings;
        this.timeOffset = 0;

        this.elm.name.value =
            "مهمان";

        this.elm.name.classList.remove(
            "error"
        );

        this.elm.date.value =
            this._getToday();

        this.elm.root.setAttribute(
            "data-theme",
            "auto"
        );

        this.elm.theme.active("auto");

        TOAST.up(
            "تنظیمات بازنشانی شد",
            "success"
        );

        this._dispatchEvent(
            "change",
            this.settings
        );

        this._dispatchEvent(
            "themeChange",
            "auto"
        );
    },

    async _clearAllData() {
        const tasks =
            localforage.createInstance({
                name: "RailyDB",
                storeName: "tasks"
            });

        const moods =
            localforage.createInstance({
                name: "RailyDB",
                storeName: "moods"
            });

        /*
         * تست قبل از ذخیره
         */
        const taskTest =
            await tasks.getItem("tasks");

        const moodTest =
            await moods.getItem("moods");

        if (
            taskTest !== null &&
            !Array.isArray(taskTest)
        ) {
            TOAST.up(
                "اطلاعات فعالیت‌ها معتبر نیست",
                "error"
            );

            return;
        }

        if (
            moodTest !== null &&
            !Array.isArray(moodTest)
        ) {
            TOAST.up(
                "اطلاعات مودها معتبر نیست",
                "error"
            );

            return;
        }

        await tasks.setItem(
            "tasks",
            []
        );

        await moods.setItem(
            "moods",
            []
        );

        TOAST.up(
            "همه اطلاعات پاک شد",
            "success"
        );

        this._dispatchEvent(
            "change"
        );
    },

    async _resetAll() {
        await this._clearAllData();
        await this._resetSettings();

        TOAST.up(
            "همه چیز بازنشانی شد",
            "success"
        );
    },

    async _saveSettings(settings) {
        /*
         * -----------------------------
         * Storage Test
         * -----------------------------
         */

        if (
            !settings ||
            typeof settings !== "object"
        ) {
            TOAST.up(
                "اطلاعات تنظیمات نامعتبر است",
                "error"
            );

            return false;
        }

        const validThemes = [
            "auto",
            "light",
            "dark"
        ];

        if (
            !validThemes.includes(
                settings.theme
            )
        ) {
            TOAST.up(
                "تم انتخاب شده نامعتبر است",
                "error"
            );

            return false;
        }

        if (
            typeof settings.name !== "string"
        ) {
            TOAST.up(
                "نام نامعتبر است",
                "error"
            );

            return false;
        }

        if (
            !Number.isFinite(
                Number(settings.timeOffset)
            )
        ) {
            TOAST.up(
                "اختلاف زمانی نامعتبر است",
                "error"
            );

            return false;
        }

        /*
         * ذخیره
         */

        try {
            await this.db.setItem(
                "settings",
                settings
            );

            /*
             * تست بعد از ذخیره
             */
            const test =
                await this.db.getItem(
                    "settings"
                );

            if (!test) {
                TOAST.up(
                    "ذخیره تنظیمات تأیید نشد",
                    "error"
                );

                return false;
            }

            return true;

        } catch (error) {
            console.error(error);

            TOAST.up(
                "خطا در ذخیره تنظیمات",
                "error"
            );

            return false;
        }
    },

    _dispatchEvent(
        name,
        detail = {}
    ) {
        this.target.dispatchEvent(
            new CustomEvent(name, {
                detail
            })
        );
    },

    set onchange(callback) {
        this.target.addEventListener(
            "change",
            event => callback(event.detail)
        );
    },

    set onthemechange(callback) {
        this.target.addEventListener(
            "themeChange",
            event => callback(event.detail)
        );
    }
};