const Store = {
    init() {
        if (!localStorage.getItem('ssb_data')) {
            const initialData = {
                ssbs: [
                    { id: 'ssb-1', name: 'Garuda Muda FC', address: 'Jakarta Selatan' },
                    { id: 'ssb-2', name: 'Bintang Timur', address: 'Surabaya' }
                ],
                siswas: [
                    { id: 's-1', name: 'Andi Pratama', age: 12, position: 'FW', photo: 'https://images.unsplash.com/photo-1574629810360-7efbbe195018?w=200&h=200&fit=crop', ssbId: 'ssb-1', status: 'Aktif' },
                    { id: 's-2', name: 'Budi Santoso', age: 13, position: 'GK', photo: 'https://images.unsplash.com/photo-1510566337590-2fc1f21d0faa?w=200&h=200&fit=crop', ssbId: 'ssb-2', status: 'Aktif' }
                ],
                latihan: [
                    { id: 'l-1', title: 'Latihan Fisik', date: '2026-02-21', time: '08:00', ssbId: 'ssb-1' }
                ],
                turnamen: [
                    { id: 't-1', title: 'Piala Walikota', date: '2026-03-10', venue: 'Std. Utama' }
                ]
            };
            localStorage.setItem('ssb_data', JSON.stringify(initialData));
        }
    },

    getData() {
        return JSON.parse(localStorage.getItem('ssb_data'));
    },

    saveData(data) {
        localStorage.setItem('ssb_data', JSON.stringify(data));
    },

    addEntity(key, item) {
        const data = this.getData();
        item.id = Date.now().toString();
        data[key].push(item);
        this.saveData(data);
        return item;
    },

    updateEntity(key, id, updatedItem) {
        const data = this.getData();
        const index = data[key].findIndex(i => i.id === id);
        if (index !== -1) {
            data[key][index] = { ...data[key][index], ...updatedItem };
            this.saveData(data);
        }
    },

    deleteEntity(key, id) {
        const data = this.getData();
        data[key] = data[key].filter(i => i.id !== id);
        this.saveData(data);
    }
};

Store.init();
window.Store = Store;
