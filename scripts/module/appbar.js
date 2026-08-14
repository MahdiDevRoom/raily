export default {
    async init() {
        this.elm = {
            title: document.querySelector('#appbar .title'),
            clock: document.getElementById('clock'),
            calendar: document.getElementById('calendar')
        };

        this.db = localforage.createInstance({
            name: 'RailyDB',
            storeName: 'settings'
        });

        await this.load();

        this.update();

        return this;
    },

    async load() {
        const settings =
            await this.db.getItem('settings') || {};

        this.name = settings.name || 'مهمان';
        this.timeOffset =
            Number(settings.timeOffset) || 0;

        this.elm.title.textContent =
            `سلام ${this.name}`;
    },

    now() {
        const date = new Date(
            Date.now() + this.timeOffset
        );

        const parts = new Intl.DateTimeFormat('fa-IR', {
            calendar: 'persian',
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
            hour12: false,
            weekday: 'long',
            numberingSystem: 'latn'
        }).formatToParts(date);

        const get = type =>
            parts.find(x => x.type === type)?.value || '';

        return {
            year: get('year'),
            month: get('month'),
            day: get('day'),
            hour: get('hour'),
            minute: get('minute'),
            second: get('second'),
            weekday: get('weekday')
        };
    },

    update() {
        const now = this.now();

        this.elm.clock.textContent =
            `${now.hour}:${now.minute}:${now.second}`;

        this.elm.calendar.textContent =
            `${now.weekday} ${now.day} ${now.month} ${now.year}`;

        this.raf = requestAnimationFrame(
            () => this.update()
        );
    },

    async refresh() {
        await this.load();
        return this;
    },

    stop() {
        cancelAnimationFrame(this.raf);
    }
};