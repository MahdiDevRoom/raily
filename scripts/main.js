// --- THEME --------------------------------------------------------
const THEME = {
    init() {
        this.root = document.documentElement;
        this.storage = 'raily-theme';
        this.target = new EventTarget();
        this.switch = document.getElementById('raily-theme-switch');

        let current = localStorage.getItem(this.storage);

        if (!current) {
            current = 'auto';
            localStorage.setItem(this.storage, current);
        }

        this.theme = current;
        this.root.setAttribute('data-theme', current);

        this.switch.querySelectorAll('span').forEach(elm => {
            elm.onclick = () => this.set(elm.dataset.action);
        });

        this.updateActiveButton();
    },

    set(theme) {
        this.theme = theme;
        this.freeze();
        localStorage.setItem(this.storage, theme);
        this.root.setAttribute('data-theme', theme);
        this.target.dispatchEvent(new CustomEvent('themeChange', { detail: theme }));
        this.updateActiveButton();
    },

    updateActiveButton() {
        this.switch.querySelectorAll('span').forEach(elm => {
            elm.classList.remove('active');
            if (elm.dataset.action === this.theme) {
                elm.classList.add('active');
            }
        });
    },

    isAuto() {
        return this.theme == 'auto';
    },
    isLight() {
        return this.theme == 'light';
    },
    isDark() {
        return this.theme == 'dark';
    },

    freeze() {
        this.root.classList.add('no-transition');
        requestAnimationFrame(() => {
            requestAnimationFrame(() => {
                this.root.classList.remove('no-transition');
            });
        });
    },

    onChange(callback) {
        this.target.addEventListener('themeChange', (e) => callback(e.detail));
    },

    offChange(callback) {
        this.target.removeEventListener('themeChange', callback);
    }
};

// --- STATUSBAR ----------------------------------------------------
const STATUSBAR = {
    init() {
        this.meta = document.querySelector('meta[name="theme-color"]');
        this.color = 'surface';
        this.set(this.color);
        THEME.onChange(() => this.reload());
    },

    set(variable) {
        const computedStyle = getComputedStyle(document.documentElement);
        let colorValue = computedStyle.getPropertyValue(`--${variable}`).trim();

        if (colorValue.includes('light-dark')) {
            colorValue = this.resolveLightDark(colorValue);
        }

        if (this.meta) {
            this.meta.setAttribute('content', colorValue);
        }
    },

    resolveLightDark(value) {
        const match = value.match(/light-dark\(([^,]+),\s*([^)]+)\)/);
        if (!match) return value;

        const lightColor = match[1].trim();
        const darkColor = match[2].trim();

        const isDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        const isLight = window.matchMedia('(prefers-color-scheme: light)').matches;

        if (THEME.theme === 'dark' || (THEME.theme === 'auto' && isDark)) {
            return darkColor;
        } else if (THEME.theme === 'light' || (THEME.theme === 'auto' && isLight)) {
            return lightColor;
        }

        return lightColor;
    },

    reload() {
        this.set(this.color);
    }
};

// --- SIDEBAR ------------------------------------------------------
const SIDEBAR = {
    init() {
        this.root = document.getElementById('sidebar');
    },

    open() {
        this.root.classList.add('active');
        localStorage.setItem(this.storage, 'open');
    },

    close() {
        this.root.classList.remove('active');
        localStorage.setItem(this.storage, 'closed');
    },

    toggle() {
        if (this.isOpen()) {
            this.close();
        } else {
            this.open();
        }
    },

    isOpen() {
        return this.root.classList.contains('active');
    }
};

// --- TIME ---------------------------------------------------------
const TIME = {
    init() {
        this.clock = document.getElementById('raily-clock');
        this.calendar = document.getElementById('raily-calendar');
        this.update();
    },

    now(date = new Date(), zone = 'fa-IR') {
        return {
            year: (f = 'numeric') => new Intl.DateTimeFormat(zone, { year: f, numberingSystem: 'latn' }).format(date),
            month: (f = 'numeric') => new Intl.DateTimeFormat(zone, { month: f, numberingSystem: 'latn' }).format(date),
            weekday: (f = 'long') => new Intl.DateTimeFormat(zone, { weekday: f, numberingSystem: 'latn' }).format(date),
            day: (f = '2-digit') => new Intl.DateTimeFormat(zone, { day: f, numberingSystem: 'latn' }).format(date),
            hour: (f = '2-digit', hour12 = false) => new Intl.DateTimeFormat(zone, { hour: f, hour12, numberingSystem: 'latn' }).format(date),
            minute: (f = '2-digit') => new Intl.DateTimeFormat(zone, { minute: f, numberingSystem: 'latn' }).format(date),
            second: (f = '2-digit') => new Intl.DateTimeFormat(zone, { second: f, numberingSystem: 'latn' }).format(date),
        }
    },

    update() {
        const now = this.now();

        if (this.clock) {
            this.clock.innerHTML = `${now.hour()}<span class="colon">:</span>${now.minute().padStart(2, '0')}<span class="colon">:</span>${now.second().padStart(2, '0')}`;
        }

        if (this.calendar) {
            this.calendar.innerHTML = `${now.weekday()} ${now.day()} ${now.month('long')} ${now.year()}`;
        }

        this.animationId = requestAnimationFrame(() => this.update());
    },

    stop() {
        if (this.animationId) {
            cancelAnimationFrame(this.animationId);
            this.animationId = null;
        }
    }
}

// --- PAGED --------------------------------------------------------
const PAGES = {
    init(config) {
        this.root = document.getElementById('pages');
        this.index = 'home';
        this.target = new EventTarget();

        window.addEventListener("DOMContentLoaded", () => {
            let hash = location.hash.slice(1);
            if (!hash) location.hash = hash = this.index;
            this.open(hash, false);
        });

        window.addEventListener("hashchange", () => this.open(location.hash.slice(1), false));
        window.addEventListener("popstate", (event) => {
            const hash = event.state?.page || this.index;
            this.open(hash, false);
        });

        this.open('home')
    },

    open(name, addHistory = true) {
        const target = this.root.querySelector(`[data-page="${name || '404'}"]`);
        const allPages = this.root.querySelectorAll('[data-page]');

        if (target) {
            allPages.forEach(elm => { if (elm.classList.contains('active')) elm.classList.remove('active') })
            if (!target.classList.contains('active')) target.classList.add('active')
        }

        this.dispatchEvent('load', name);
        window.scrollTo({ top: 0, behavior: 'smooth' });

        if (addHistory && this.current !== name) history.pushState(name, "", `#${name}`);
        this.current = name;
    },

    dispatchEvent(name, detail = {}) {
        this.target.dispatchEvent(new CustomEvent(name, { detail }));
    },

    set onload(callback) {
        this.target.addEventListener('load', (e) => callback(e.detail));
    },

    set onstart(callback) {
        this.target.addEventListener('start', (e) => callback(e.detail));
    },


}

// --- DATEPICKER ---------------------------------------------------
const DATEPICKER = {
    init() {
        this.root = document.getElementById('datepicker');
        this.view = 'day';

        this.yearEl = this.root.querySelector('.header .year');
        this.monthEl = this.root.querySelector('.header .month');
        this.dayEl = this.root.querySelector('.header .day');
        this.nextBtn = this.root.querySelector('.header .next');
        this.backBtn = this.root.querySelector('.header .back');

        this.dayViewEl = this.root.querySelector('.day-view');
        this.monthViewEl = this.root.querySelector('.month-view');
        this.yearViewEl = this.root.querySelector('.year-view');
        this.weekdayEl = this.root.querySelector('.weekday');
        this.daysEl = this.root.querySelector('.days');
        this.monthsEl = this.root.querySelector('.months');
        this.yearsEl = this.root.querySelector('.years');

        this.submitBtn = this.root.querySelector('.footer .submit');
        this.resetBtn = this.root.querySelector('.footer .reset');
        this.cancelBtn = this.root.querySelector('.footer .cancel');
        this.bgEl = this.root.querySelector('.bg');

        this.year = TIME.now().year();
        this.month = TIME.now().month();
        this.day = TIME.now().day();

        this.monthNames = ['فروردین', 'اردیبهشت', 'خرداد', 'تیر', 'مرداد', 'شهریور', 'مهر', 'آبان', 'آذر', 'دی', 'بهمن', 'اسفند'];
        this.weekdayNames = ['ش', 'ی', 'د', 'س', 'چ', 'پ', 'ج'];

        this.render();
        this.attachEvents();
    },

    attachEvents() {
        this.dayEl.addEventListener('click', () => {
            this.view = 'day';
            this.showView('day');
        });

        this.monthEl.addEventListener('click', () => {
            this.view = 'month';
            this.showView('month');
        });

        this.yearEl.addEventListener('click', () => {
            this.view = 'year';
            this.showView('year');
        });

        this.backBtn.addEventListener('click', () => {
            if (this.view === 'day') {
                this.day--;
                if (this.day < 1) this.day = this.getDaysInMonth();
            } else if (this.view === 'month') {
                this.month--;
                this.day = (this.getDaysInMonth() < this.day) ? this.getDaysInMonth() : this.day;
                if (this.month < 1) this.month = 12;
            } else if (this.view === 'year') {
                this.year--;
            }
            this.render();
        });

        this.nextBtn.addEventListener('click', () => {
            if (this.view === 'day') {
                this.day++;
                if (this.day > this.getDaysInMonth()) this.day = 1;
            } else if (this.view === 'month') {
                this.month++;
                this.day = (this.getDaysInMonth() < this.day) ? this.getDaysInMonth() : this.day;
                if (this.month > 12) this.month = 1;
            } else if (this.view === 'year') {
                this.year++;
            }
            this.render();
        });

        this.daysEl.addEventListener('click', (e) => {
            const dayEl = e.target.closest('[data-day]');
            if (dayEl) {
                this.day = parseInt(dayEl.dataset.day, 10);
                this.render();
            }
        });

        this.monthsEl.addEventListener('click', (e) => {
            const monthEl = e.target.closest('[data-month]');
            if (monthEl) {
                const monthName = monthEl.dataset.month;
                this.month = this.monthNames.indexOf(monthName) + 1;
                this.render();
            }
        });

        this.yearsEl.addEventListener('click', (e) => {
            const yearEl = e.target.closest('[data-year]');
            if (yearEl) {
                this.year = parseInt(yearEl.dataset.year, 10);
                this.render();
            }
        });

        this.resetBtn.addEventListener('click', () => {
            this.reset();
        });

        this.cancelBtn.addEventListener('click', () => {
            this.close();
        });

        this.submitBtn.addEventListener('click', () => {
            const result = this.formatDate();
            if (this.onSelect) this.onSelect(result);
            this.close();
        });

        this.bgEl.addEventListener('click', () => {
            this.close();
        });
    },

    showView(view) {
        this.dayViewEl.classList.remove('active');
        this.monthViewEl.classList.remove('active');
        this.yearViewEl.classList.remove('active');
        this.dayEl.classList.remove('active');
        this.monthEl.classList.remove('active');
        this.yearEl.classList.remove('active');

        if (view === 'day') {
            this.dayViewEl.classList.add('active');
            this.dayEl.classList.add('active');
            this.renderDayView();
        } else if (view === 'month') {
            this.monthViewEl.classList.add('active');
            this.monthEl.classList.add('active');
            this.renderMonthView();
        } else if (view === 'year') {
            this.yearViewEl.classList.add('active');
            this.yearEl.classList.add('active');
            this.renderYearView();
        }
    },

    render() {
        this.renderDayView();
        this.renderMonthView();
        this.renderYearView();

        this.yearEl.textContent = this.year;
        this.monthEl.textContent = this.monthNames[this.month - 1];
        this.dayEl.textContent = this.day;
    },

    renderDayView() {
        const daysInMonth = this.getDaysInMonth();
        const firstWeekday = this.jalaliWeekday(this.year, this.month, 1);

        this.weekdayEl.innerHTML = this.weekdayNames.map(d => `<span> ${d} </span>`).join('');

        let html = '';
        for (let i = 0; i < firstWeekday; i++) {
            html += `<span class="empty"></span>`;
        }
        for (let day = 1; day <= daysInMonth; day++) {
            html += (this.day == day)
                ? `<span class="current" data-day="${day}"> ${day} </span>`
                : `<span data-day="${day}">${day}</span>`;
        }
        this.daysEl.innerHTML = html;
    },

    renderMonthView() {
        this.monthsEl.innerHTML = this.monthNames.map(month => {
            if (parseInt(this.monthNames.indexOf(month)) + 1 == this.month) {
                return `<span class="current" data-month="${month}"> ${month} </span>`;
            }
            return `<span data-month="${month}"> ${month} </span>`;
        }).join('');
    },

    renderYearView() {
        const startYear = Number(this.year) - 10;
        const endYear = Number(this.year) + 10;

        let html = '';

        for (let y = startYear; y <= endYear; y++) {
            if (this.year == y) {
                html += `<span class="current" data-year="${y}">${y}</span>`;
            } else {
                html += `<span data-year="${y}">${y}</span>`;
            }
        }

        this.yearsEl.innerHTML = html;
    },

    formatDate(year = this.year, month = this.month, day = this.day) {
        return `${year}/${String(month).padStart(2, '0')}/${String(day).padStart(2, '0')}`;
    },

    jalaliToGregorian(jy, jm, jd) {
        let gy = (jy <= 979) ? 621 : 1600;
        jy -= (jy <= 979) ? 0 : 979;
        let days = (365 * jy) + (Math.floor(jy / 33) * 8) + Math.floor(((jy % 33) + 3) / 4) + 78 + jd +
            ((jm < 7) ? (jm - 1) * 31 : ((jm - 7) * 30) + 186);
        gy += 400 * Math.floor(days / 146097);
        days %= 146097;
        if (days > 36524) {
            gy += 100 * Math.floor(--days / 36524);
            days %= 36524;
            if (days >= 365) days++;
        }
        gy += 4 * Math.floor(days / 1461);
        days %= 1461;
        if (days > 365) {
            gy += Math.floor((days - 1) / 365);
            days = (days - 1) % 365;
        }
        let gd = days + 1;
        const leap = (gy % 4 === 0 && gy % 100 !== 0) || (gy % 400 === 0);
        const monthDays = [0, 31, leap ? 29 : 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
        let gm = 1;
        for (; gm <= 12; gm++) {
            if (gd <= monthDays[gm]) break;
            gd -= monthDays[gm];
        }
        return { year: gy, month: gm, day: gd };
    },

    jalaliWeekday(jy, jm, jd) {
        const { year, month, day } = this.jalaliToGregorian(jy, jm, jd);
        const jsDay = new Date(year, month - 1, day).getDay();
        return (jsDay + 1) % 7;
    },

    getDaysInMonth(year = this.year, month = this.month) {
        if (month >= 1 && month <= 6) return 31;
        if (month >= 7 && month <= 11) return 30;
        const leap = (year % 33 === 1 || year % 33 === 5 || year % 33 === 9 ||
            year % 33 === 13 || year % 33 === 17 || year % 33 === 22 ||
            year % 33 === 26 || year % 33 === 30);
        return leap ? 30 : 29;
    },

    reset() {
        this.year = TIME.now().year();
        this.month = TIME.now().month();
        this.day = TIME.now().day();
        this.render();
    },

    open(callback) {
        this.onSelect = callback || null;
        this.root.classList.add('active');
        this.reset()
        this.showView('day');
    },

    close() {
        this.root.classList.remove('active');
    }

}

// --- CONFIRM DIALOG ------------------------------------------------
const CONFIRM = {
    init() {
        this.root = document.getElementById('confirm');

        this.fg = this.root.querySelector('.fg');
        this.bg = this.root.querySelector('.bg');
        this.titleEl = this.root.querySelector('.header .title');
        this.messageEl = this.root.querySelector('.body .message');
        this.confirmBtn = this.root.querySelector('.footer .confirm');
        this.cancelBtn = this.root.querySelector('.footer .cancel');

        this.confirmBtn.addEventListener('click', () => {
            if (this.onConfirm) this.onConfirm();
            this.close();
        });

        this.cancelBtn.addEventListener('click', () => {
            if (this.onCancel) this.onCancel();
            this.close();
        });

        this.bg.addEventListener('click', () => {
            if (this.onCancel) this.onCancel();
            this.close();
        });

        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.root.classList.contains('active')) {
                if (this.onCancel) this.onCancel();
                this.close();
            }
        });
    },

    open(options = {}) {
        const {
            title = 'تایید',
            message = 'آیا از انجام این کار مطمئن هستید؟',
            confirmText = 'تایید',
            cancelText = 'انصراف',
            onConfirm = null,
            onCancel = null,
        } = options;

        this.titleEl.textContent = title;
        this.messageEl.textContent = message;
        this.confirmBtn.textContent = confirmText;
        this.cancelBtn.textContent = cancelText;
        this.onConfirm = onConfirm;
        this.onCancel = onCancel;

        this.root.classList.add('active');
    },

    close() {
        this.root.classList.remove('active');
    },

    confirm(message, onConfirm) {
        this.open({
            message,
            onConfirm,
            onCancel: null,
        });
    },

    ask(options) {
        this.open(options);
    },
};

// --- TOAST --------------------------------------------------------
const TOAST = {
    init() {
        this.root = document.getElementById('toast');
    },

    add(input = 'Hey', type = 'info', pos = 'bl') {
        const symbol = {
            info: 'info',
            success: 'check_circle',
            warning: 'warning',
            error: 'error',
        };

        const position = [
            'tl', 'tc', 'tr',
            'cl', 'cc', 'cr',
            'bl', 'bc', 'cr',
        ];

        this.root.innerHTML = `<div class="${type} ${pos}"> 
            <span class="symbol"> ${symbol[type]} </span>
            <span class="content"> ${input} </span>
        </div>`;

        setTimeout(() => { this.root.innerHTML = '' }, 4000);
    }
}

// --- TASK ---------------------------------------------------------
const TASK = {
    init() {
        this.newTaskRoot = document.getElementById('new-task-form');
        this.newTaskTitle = this.newTaskRoot.querySelector('#task-title');
        this.newTaskCategory = this.newTaskRoot.querySelector('#task-category');
        this.newTaskDescriptions = this.newTaskRoot.querySelector('#task-descriptions');
        this.newTaskDate = this.newTaskRoot.querySelector('#task-date');
        this.newTaskPriority = this.newTaskRoot.querySelector('#task-priority');
        this.newTaskAction = document.querySelector('#fab > [data-action="add-task"]');
        this.taskListRoot = document.querySelector('[data-page="home"] .page-body');

        this.newTaskAction.addEventListener('click', () => this.addTask());

        this.renderTasks();
    },

    addTask() {
        const title = this.newTaskTitle.value;
        const category = this.newTaskCategory.value;
        const descriptions = this.newTaskDescriptions.value;
        const date = this.newTaskDate.value;
        const priority = this.newTaskPriority.value;

        if (title.trim().length <= 0) {
            this.newTaskTitle.classList.add('error');
            this.newTaskTitle.focus();
            TOAST.add('عنوان نمیتواند خالی باشد', 'error', 'bl');
            return
        }

        if (title.trim().length > 100) {
            this.newTaskTitle.classList.add('error');
            this.newTaskTitle.focus();
            TOAST.add('کارکتر بیش از حد مجاز', 'error', 'bl');
            return
        }

        if (date.trim().length <= 0) {
            this.newTaskDate.classList.add('error');
            this.newTaskDate.focus();
            TOAST.add('تاریخ نمیتواند خالی باشد', 'error', 'bl');
            return
        }

        const newTask = {
            id: Date.now(),
            title, category, descriptions, date, priority,
            completed: false,
            createdAt: new Date().toISOString(),
        };

        this.saveTask(newTask);
        PAGES.open('home', false)
    },

    async saveTask(task) {
        try {
            const tasks = await this.getTasks();
            tasks.push(task);
            await localforage.setItem('tasks', tasks);

            TOAST.add('فعالیت با موفقیت اضافه شد', 'success', 'bl');
            this.resetForm();
            this.renderTasks();

            if (this.onTaskAdded) {
                this.onTaskAdded(task);
            }

        } catch (error) {
            TOAST.add('خطا در ذخیره فعالیت', 'error', 'bl');
        }
    },

    async getTasks() {
        try {
            const tasks = await localforage.getItem('tasks');
            return tasks || [];
        } catch (error) {
            console.error('❌ خطا در دریافت تسک‌ها:', error);
            return [];
        }
    },

    resetForm() {
        this.newTaskTitle.value = '';
        this.newTaskCategory.value = 'study';
        this.newTaskDescriptions.value = '';
        this.newTaskDate.value = '';
        this.newTaskPriority.value = 'medium';
        this.newTaskTitle.focus();

        this.newTaskTitle.classList.remove('error');
        this.newTaskDate.classList.remove('error');
    },

    async renderTasks() {
        const tasks = await this.getTasks();

        if (!this.taskListRoot) return;

        if (tasks.length === 0) {
            this.taskListRoot.innerHTML = `
                <div class="empty-state">
                    <span class="empty-icon symbol"> content_paste_off </span>
                    <p class="empty-text">هیچ فعالیتی ثبت نشده است</p>
                    <p class="empty-hint">برای افزودن فعالیت جدید، دکمه + را بزنید</p>
                </div>
            `;
            return;
        }

        tasks.sort((a, b) => b.id - a.id);

        let html = `<div class="task-list">`;

        tasks.forEach(task => {
            const priorityLabel = {
                low: '🟢 کم',
                medium: '🟡 متوسط',
                high: '🔴 بالا'
            };

            const categoryLabel = {
                study: '📚 مطالعه',
                work: '💼 کار',
                exercise: '🏋️ ورزش',
                rest: '😌 استراحت',
                fun: '🎉 تفریح',
                sleep: '😴 خواب',
                other: '📌 سایر'
            };

            html += `
    <div class="task-item ${task.completed ? 'completed' : ''} priority-${task.priority}" data-id="${task.id}">
        <div class="task-info">
            <div class="task-header">
                <span class="task-title">${task.title}</span>
            </div>
            <div class="task-meta">
                <span class="task-category category-${task.category}">${categoryLabel[task.category] || task.category}</span>
                <span class="task-date">${task.date}</span>
            </div>
            ${task.descriptions ? `<p class="task-desc">${task.descriptions}</p>` : ''}
        </div>
        <div class="task-actions">
            <button class="task-toggle" data-action="toggle" data-id="${task.id}">
                <span class="symbol">${task.completed ? 'Undo' : 'Done'}</span>
            </button>
            <button class="task-delete" data-action="delete" data-id="${task.id}">
                <span class="symbol">Delete</span>
            </button>
        </div>
    </div>
`;
        });

        html += `</div>`;
        this.taskListRoot.innerHTML = html;

        this.taskListRoot.querySelectorAll('[data-action="toggle"]').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const id = parseInt(btn.dataset.id);
                this.toggleTask(id);
            });
        });

        this.taskListRoot.querySelectorAll('[data-action="delete"]').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const id = parseInt(btn.dataset.id);
                this.deleteTask(id);
            });
        });
    },

    async toggleTask(id) {
        try {
            const tasks = await this.getTasks();
            const task = tasks.find(t => t.id === id);
            if (!task) {
                TOAST.add('فعالیت پیدا نشد', 'error', 'bl');
                return;
            }

            task.completed = !task.completed;
            await localforage.setItem('tasks', tasks);

            const status = task.completed ? 'انجام شد' : 'به لیست بازگشت';
            TOAST.add(`✅ فعالیت "${task.title}" ${status}`, 'success', 'bl');
            this.renderTasks();

        } catch (error) {
            console.error('❌ خطا:', error);
            TOAST.add('خطا در تغییر وضعیت', 'error', 'bl');
        }
    },

    async deleteTask(id) {
        const tasks = await this.getTasks();
        const task = tasks.find(t => t.id === id);
        if (!task) {
            TOAST.add('فعالیت پیدا نشد', 'error', 'bl');
            return;
        }

        CONFIRM.open({
            title: 'حذف فعالیت',
            message: `آیا از حذف "${task.title}" مطمئن هستید؟`,
            confirmText: '🗑️ حذف',
            cancelText: 'انصراف',
            onConfirm: async () => {
                const filtered = tasks.filter(t => t.id !== id);
                await localforage.setItem('tasks', filtered);
                TOAST.add(`🗑️ فعالیت "${task.title}" حذف شد`, 'info', 'bl');
                this.renderTasks();
            },
        });
    },

    async getCount() {
        const tasks = await this.getTasks();
        return tasks.length;
    },

    async getCompletedCount() {
        const tasks = await this.getTasks();
        return tasks.filter(t => t.completed).length;
    },

    async getPendingCount() {
        const tasks = await this.getTasks();
        return tasks.filter(t => !t.completed).length;
    },

    onTaskAdded: null,
};

// --- App ----------------------------------------------------------
THEME.init();
STATUSBAR.init();
SIDEBAR.init();
TIME.init();
PAGES.init();
DATEPICKER.init();
TOAST.init();
CONFIRM.init();
TASK.init();

PAGES.onload = (pagename) => {
    const fab = document.querySelectorAll('#fab>*');

    fab.forEach(btn => { if (btn.classList.contains('active')) btn.classList.remove('active') })

    switch (pagename) {
        case 'home':
            document.querySelector('#fab [data-action="new-task"]').classList.add('active');
            break;

        case 'new-task':
            document.querySelector('#fab [data-action="add-task"]').classList.add('active');
            break;
    }
}