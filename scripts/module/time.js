export default {
    init() {
        this.clock = document.getElementById('clock');
        this.calendar = document.getElementById('calendar');
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