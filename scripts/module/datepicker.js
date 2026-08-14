export default {
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

        this.year = this.now().year();
        this.month = this.now().month();
        this.day = this.now().day();

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
        this.year = this.now().year();
        this.month = this.now().month();
        this.day = this.now().day();
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
