// --- THEME --------------------------------------------------------
const THEME = {
    theme: null,
    root: null,
    storage: null,
    target: null,
    switch: null,

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
    meta: null,
    color: null,

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
    root: null,

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
    clock: null,
    calendar: null,
    animationId: null,

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
    index: null,
    root: null,
    spinner: null,
    current: null,
    target: new EventTarget(),

    init(config) {
        this.root = document.getElementById('pages');
        this.index = 'home';

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

// --- App ----------------------------------------------------------
THEME.init();
STATUSBAR.init();
SIDEBAR.init();
TIME.init();
PAGES.init();
PAGES.open('new-task');
DATEPICKER.init();

PAGES.onload = (pagename) => {
    const fab = document.querySelector('#fab');
    if (pagename == 'new-task') {
        if (fab.classList.contains('active')) fab.classList.remove('active')
    } else {
        if (!fab.classList.contains('active')) fab.classList.add('active')
    }
}