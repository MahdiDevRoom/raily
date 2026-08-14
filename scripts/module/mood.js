
export default {
    init() {
        this.store = localforage.createInstance({
            name: 'RailyDB',
            storeName: 'moods'
        });
        return this;
    },
    async getAll() {
        const moods = await this.store.getItem('moods');
        return moods || [];
    },
    async get(id) {
        const moods = await this.getAll();
        return moods.find(m => m.id === id) || null;
    },
    async getByDate(date) {
        const moods = await this.getAll();
        return moods.find(m => m.date === date) || null;
    },
    async getToday() {
        const today = new Intl.DateTimeFormat('fa-IR', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            numberingSystem: 'latn'
        }).format(new Date());
        return this.getByDate(today);
    },
    async add(data) {
        const moods = await this.getAll();
                const exists = moods.some(m => m.date === data.date);
        if (exists) {
            throw new Error('مود امروز قبلاً ثبت شده است');
        }

        const newMood = {
            id: Date.now(),
            ...data,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };
        moods.push(newMood);
        await this.store.setItem('moods', moods);
        return newMood;
    },
    async update(id, updates) {
        const moods = await this.getAll();
        const index = moods.findIndex(m => m.id === id);
        if (index === -1) return null;

        moods[index] = {
            ...moods[index],
            ...updates,
            updatedAt: new Date().toISOString()
        };
        await this.store.setItem('moods', moods);
        return moods[index];
    },
    async delete(id) {
        const moods = await this.getAll();
        const filtered = moods.filter(m => m.id !== id);
        await this.store.setItem('moods', filtered);
        return filtered;
    },
    async deleteAll() {
        await this.store.setItem('moods', []);
        return [];
    },
    async count() {
        const moods = await this.getAll();
        return moods.length;
    },
    async getByDateRange(startDate, endDate) {
        const moods = await this.getAll();
        return moods.filter(m => m.date >= startDate && m.date <= endDate);
    },
    async getLatest(limit = 7) {
        const moods = await this.getAll();
        return moods.sort((a, b) => b.id - a.id).slice(0, limit);
    },
    async getByMonth(year, month) {
        const moods = await this.getAll();
        const monthStr = String(month).padStart(2, '0');
        return moods.filter(m => m.date.startsWith(`${year}/${monthStr}`));
    }
};