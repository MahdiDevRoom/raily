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

        this.monthNames = [
            'فروردین', 'اردیبهشت', 'خرداد',
            'تیر', 'مرداد', 'شهریور',
            'مهر', 'آبان', 'آذر',
            'دی', 'بهمن', 'اسفند'
        ];

        this.weekdayNames = ['ش', 'ی', 'د', 'س', 'چ', 'پ', 'ج'];

        const now = new Date();

        this.year = Number(this.now(now).year());
        this.month = Number(this.now(now).month());
        this.day = Number(this.now(now).day());

        this.render();
        this.attachEvents();

        return this;
    },

    attachEvents() {
        this.dayEl.onclick = () => {
            this.view = 'day';
            this.showView('day');
        };

        this.monthEl.onclick = () => {
            this.view = 'month';
            this.showView('month');
        };

        this.yearEl.onclick = () => {
            this.view = 'year';
            this.showView('year');
        };

        this.backBtn.onclick = () => {
            if (this.view === 'day') {
                this.day--;

                if (this.day < 1) {
                    this.month--;

                    if (this.month < 1) {
                        this.month = 12;
                        this.year--;
                    }

                    this.day = this.getDaysInMonth();
                }
            }

            if (this.view === 'month') {
                this.month--;

                if (this.month < 1) {
                    this.month = 12;
                    this.year--;
                }

                this.day = Math.min(this.day, this.getDaysInMonth());
            }

            if (this.view === 'year') {
                this.year--;
            }

            this.render();
        };

        this.nextBtn.onclick = () => {
            if (this.view === 'day') {
                this.day++;

                if (this.day > this.getDaysInMonth()) {
                    this.day = 1;
                    this.month++;

                    if (this.month > 12) {
                        this.month = 1;
                        this.year++;
                    }
                }
            }

            if (this.view === 'month') {
                this.month++;

                if (this.month > 12) {
                    this.month = 1;
                    this.year++;
                }

                this.day = Math.min(this.day, this.getDaysInMonth());
            }

            if (this.view === 'year') {
                this.year++;
            }

            this.render();
        };

        this.daysEl.onclick = (e) => {
            const target = e.target.closest('[data-day]');
            if (!target) return;

            this.day = Number(target.dataset.day);
            this.render();
        };

        this.monthsEl.onclick = (e) => {
            const target = e.target.closest('[data-month]');
            if (!target) return;

            this.month = Number(target.dataset.month);
            this.render();
        };

        this.yearsEl.onclick = (e) => {
            const target = e.target.closest('[data-year]');
            if (!target) return;

            this.year = Number(target.dataset.year);
            this.render();
        };

        this.submitBtn.onclick = () => {
            const date = this.formatDate();

            if (this.onSelect) {
                this.onSelect(date);
            }

            this.close();
        };

        this.resetBtn.onclick = () => {
            this.reset();
        };

        this.cancelBtn.onclick = () => {
            this.close();
        };

        this.bgEl.onclick = () => {
            this.close();
        };
    },

    showView(view) {
        this.view = view;

        this.dayViewEl.classList.toggle('active', view === 'day');
        this.monthViewEl.classList.toggle('active', view === 'month');
        this.yearViewEl.classList.toggle('active', view === 'year');

        this.dayEl.classList.toggle('active', view === 'day');
        this.monthEl.classList.toggle('active', view === 'month');
        this.yearEl.classList.toggle('active', view === 'year');

        if (view === 'day') this.renderDayView();
        if (view === 'month') this.renderMonthView();
        if (view === 'year') this.renderYearView();
    },

    render() {
        this.yearEl.textContent = this.year;
        this.monthEl.textContent = this.monthNames[this.month - 1];
        this.dayEl.textContent = this.day;

        this.renderDayView();
        this.renderMonthView();
        this.renderYearView();

        this.showView(this.view);
    },

    renderDayView() {
        const daysInMonth = this.getDaysInMonth();
        const firstWeekday = this.jalaliWeekday(this.year, this.month, 1);

        this.weekdayEl.innerHTML = this.weekdayNames
            .map(day => `<span>${day}</span>`)
            .join('');

        let html = '';

        for (let i = 0; i < firstWeekday; i++) {
            html += '<span class="empty"></span>';
        }

        for (let day = 1; day <= daysInMonth; day++) {
            html += `
                <span
                    class="${this.day === day ? 'current' : ''}"
                    data-day="${day}"
                >
                    ${day}
                </span>
            `;
        }

        this.daysEl.innerHTML = html;
    },

    renderMonthView() {
        this.monthsEl.innerHTML = this.monthNames
            .map((name, index) => {
                const month = index + 1;

                return `
                    <span
                        class="${this.month === month ? 'current' : ''}"
                        data-month="${month}"
                    >
                        ${name}
                    </span>
                `;
            })
            .join('');
    },

    renderYearView() {
        let html = '';

        for (let year = this.year - 10; year <= this.year + 10; year++) {
            html += `
                <span
                    class="${this.year === year ? 'current' : ''}"
                    data-year="${year}"
                >
                    ${year}
                </span>
            `;
        }

        this.yearsEl.innerHTML = html;
    },

    formatDate() {
        return `${this.year}/${String(this.month).padStart(2, '0')}/${String(this.day).padStart(2, '0')}`;
    },

    jalaliToGregorian(jy, jm, jd) {
        let gy = jy > 979 ? 1600 : 621;
        let jy2 = jy > 979 ? jy - 979 : jy;

        let days =
            365 * jy2 +
            Math.floor(jy2 / 33) * 8 +
            Math.floor(((jy2 % 33) + 3) / 4) +
            78 +
            jd +
            (jm < 7
                ? (jm - 1) * 31
                : (jm - 7) * 30 + 186);

        gy += 400 * Math.floor(days / 146097);
        days %= 146097;

        if (days > 36524) {
            gy += 100 * Math.floor(--days / 36524);
            days %= 36524;

            if (days >= 365) {
                days++;
            }
        }

        gy += 4 * Math.floor(days / 1461);
        days %= 1461;

        if (days > 365) {
            gy += Math.floor((days - 1) / 365);
            days = (days - 1) % 365;
        }

        const gd = days + 1;

        const leap =
            (gy % 4 === 0 && gy % 100 !== 0) ||
            gy % 400 === 0;

        const monthDays = [
            31,
            leap ? 29 : 28,
            31,
            30,
            31,
            30,
            31,
            31,
            30,
            31,
            30,
            31
        ];

        let day = gd;
        let gm = 1;

        while (day > monthDays[gm - 1]) {
            day -= monthDays[gm - 1];
            gm++;
        }

        return {
            year: gy,
            month: gm,
            day
        };
    },

    jalaliWeekday(jy, jm, jd) {
        const date = this.jalaliToGregorian(jy, jm, jd);
        const day = new Date(
            date.year,
            date.month - 1,
            date.day
        ).getDay();

        return (day + 1) % 7;
    },

    getDaysInMonth(year = this.year, month = this.month) {
        if (month <= 6) return 31;
        if (month <= 11) return 30;

        const leap =
            year % 33 === 1 ||
            year % 33 === 5 ||
            year % 33 === 9 ||
            year % 33 === 13 ||
            year % 33 === 17 ||
            year % 33 === 22 ||
            year % 33 === 26 ||
            year % 33 === 30;

        return leap ? 30 : 29;
    },

    now(date = new Date()) {
        const formatter = new Intl.DateTimeFormat('fa-IR', {
            year: 'numeric',
            month: 'numeric',
            day: 'numeric',
            numberingSystem: 'latn'
        });

        const parts = formatter.formatToParts(date);

        const get = type =>
            Number(parts.find(part => part.type === type)?.value);

        return {
            year: () => get('year'),
            month: () => get('month'),
            day: () => get('day')
        };
    },

    reset() {
        const now = new Date();

        this.year = Number(this.now(now).year());
        this.month = Number(this.now(now).month());
        this.day = Number(this.now(now).day());

        this.view = 'day';
        this.render();
    },

    open(callback) {
        this.onSelect = callback || null;
        this.reset();
        this.root.classList.add('active');
    },

    close() {
        this.root.classList.remove('active');
    }
};