const App = {
    state: {
        currentView: 'dashboard',
        filters: { age: 'all', ssb: 'all', status: 'all' },
        tempPhoto: '',
        editingId: { student: null, latihan: null, turnamen: null, ssb: null }
    },

    init() {
        this.bindEvents();
        if (Auth.checkSession()) {
            this.showMainView();
        } else {
            this.showLoginView();
        }
    },

    bindEvents() {
        document.querySelectorAll('.nav-link').forEach(link => {
            link.addEventListener('click', (e) => {
                const view = e.target.closest('.nav-link').dataset.view;
                if (view) {
                    e.preventDefault();
                    this.switchView(view);
                    this.closeMobileMenu();
                }
            });
        });

        document.getElementById('menu-toggle')?.addEventListener('click', () => {
            document.querySelector('.sidebar')?.classList.toggle('open');
        });

        document.addEventListener('click', (e) => {
            const sidebar = document.querySelector('.sidebar');
            const toggle = document.getElementById('menu-toggle');
            if (sidebar && window.innerWidth <= 992 && sidebar.classList.contains('open') &&
                !sidebar.contains(e.target) && !toggle.contains(e.target)) {
                this.closeMobileMenu();
            }
        });

        document.getElementById('login-form').addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleLogin();
        });

        document.getElementById('logout-btn').addEventListener('click', (e) => {
            e.preventDefault();
            Auth.logout();
        });

        document.addEventListener('click', (e) => {
            const id = e.target.id;
            if (id.startsWith('btn-cancel-')) {
                const view = id.replace('btn-cancel-', '').replace('-form', '');
                this.switchView(view === 'latihan' ? 'jadwal-latihan' :
                    view === 'turnamen' ? 'jadwal-turnamen' : view);
            }
        });

        document.addEventListener('submit', (e) => {
            const handlers = {
                'student-form': 'handleStudentSubmit',
                'latihan-form': 'handleLatihanSubmit',
                'turnamen-form': 'handleTurnamenSubmit',
                'ssb-form': 'handleSSBSubmit'
            };
            if (handlers[e.target.id]) {
                e.preventDefault();
                this[handlers[e.target.id]]();
            }
        });

        document.addEventListener('change', (e) => {
            if (e.target.id === 's-photo') this.handleImagePreview(e.target);
        });
    },

    showLoginView() {
        this.toggleView('login-view', 'main-view');
    },

    showMainView() {
        this.toggleView('main-view', 'login-view');
        const roleEl = document.getElementById('user-role');
        if (roleEl) roleEl.innerText = Auth.currentUser.role;
        this.switchView('dashboard');
    },

    switchView(view) {
        this.state.currentView = view;
        this.updateNavUI(view);
        const content = document.getElementById('view-content');
        if (content) {
            content.classList.remove('fade-in');
            void content.offsetWidth; // Trigger reflow
            content.classList.add('fade-in');
        }
        this.render();
    },

    render() {
        const content = document.getElementById('view-content');
        const viewTitle = document.getElementById('view-title');

        const views = {
            'dashboard': { title: 'Dashboard', render: () => this.renderDashboard() },
            'ssb': { title: 'Manajemen SSB', render: () => this.renderSSB() },
            'ssb-form': { title: 'Form Data SSB', render: () => this.renderSSBForm() },
            'siswa': { title: 'Data Siswa', render: () => this.renderSiswa() },
            'siswa-form': { title: 'Form Data Siswa', render: () => this.renderSiswaForm() },
            'jadwal-latihan': { title: 'Jadwal Latihan', render: () => this.renderLatihan() },
            'latihan-form': { title: 'Form Jadwal Latihan', render: () => this.renderLatihanForm() },
            'jadwal-turnamen': { title: 'Jadwal Turnamen', render: () => this.renderTurnamen() },
            'turnamen-form': { title: 'Form Jadwal Turnamen', render: () => this.renderTurnamenForm() }
        };

        const current = views[this.state.currentView] || views.dashboard;
        if (viewTitle) viewTitle.innerText = current.title;
        if (content) content.innerHTML = current.render();
    },

    renderDashboard() {
        const data = Store.getData();
        const user = Auth.currentUser;

        return `
            <div class="stats-grid">
                ${this.renderStatCard('Total SSB', data.ssbs.length, '0s')}
                ${this.renderStatCard('Jumlah Siswa', data.siswas.length, '0.1s')}
                ${this.renderStatCard('Jadwal Latihan', data.latihan.length, '0.2s')}
                ${this.renderStatCard('Jadwal Turnamen', data.turnamen.length, '0.3s')}
            </div>
            <div class="card glass slide-up" style="animation-delay: 0.4s">
                <h3>Aktivitas Terbaru</h3>
                <p style="color: var(--text-dim); margin-top: 10px;">Anda memiliki akses penuh sebagai <strong>${user.role}</strong>.</p>
                <div style="margin-top: 20px;">
                    <p>Selamat Datang, <strong style="color: var(--primary)">${user.username}</strong>!</p>
                </div>
            </div>
        `;
    },

    renderSiswa() {
        const data = Store.getData();
        const filteredSiswa = data.siswas.filter(s => {
            const ageMatch = this.state.filters.age === 'all' ||
                (this.state.filters.age === 'u12' && s.age <= 12) ||
                (this.state.filters.age === 'u15' && s.age > 12 && s.age <= 15) ||
                (this.state.filters.age === 'u18' && s.age > 15);
            const ssbMatch = this.state.filters.ssb === 'all' || s.ssbId === this.state.filters.ssb;
            const statusMatch = this.state.filters.status === 'all' || s.status === this.state.filters.status;
            return ageMatch && ssbMatch && statusMatch;
        });

        const ssbOptions = data.ssbs.map(s =>
            `<option value="${s.id}" ${this.state.filters.ssb === s.id ? 'selected' : ''}>${s.name}</option>`
        ).join('');

        return `
            <div class="card glass fade-in" style="margin-bottom: 28px; display: flex; gap: 20px; flex-wrap: wrap;">
                ${this.renderFilter('Umur', 'age', `
                    <option value="all" ${this.state.filters.age === 'all' ? 'selected' : ''}>Semua Umur</option>
                    <option value="u12" ${this.state.filters.age === 'u12' ? 'selected' : ''}>U-12 (&le;12)</option>
                    <option value="u15" ${this.state.filters.age === 'u15' ? 'selected' : ''}>U-15 (13-15)</option>
                    <option value="u18" ${this.state.filters.age === 'u18' ? 'selected' : ''}>U-18 (>15)</option>
                `)}
                ${this.renderFilter('SSB Affiliasi', 'ssb', `<option value="all" ${this.state.filters.ssb === 'all' ? 'selected' : ''}>Semua SSB</option>${ssbOptions}`)}
                ${this.renderFilter('Status', 'status', `
                    <option value="all" ${this.state.filters.status === 'all' ? 'selected' : ''}>Semua Status</option>
                    <option value="Aktif" ${this.state.filters.status === 'Aktif' ? 'selected' : ''}>Aktif</option>
                    <option value="Non-Aktif" ${this.state.filters.status === 'Non-Aktif' ? 'selected' : ''}>Non-Aktif</option>
                `)}
            </div>
            <div class="card glass slide-up" style="animation-delay: 0.1s">
                <div style="margin-bottom: 24px; display:flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 12px;">
                    <h3>Data Siswa SSB</h3>
                    <div style="display:flex; gap: 8px;">
                        <button class="btn-sm" style="background: var(--primary); color: white;" onclick="App.exportSiswaToPDF()">Export PDF</button>
                        <button class="btn-sm btn-add" style="margin:0" onclick="App.showAddSiswa()">+ Tambah Siswa</button>
                    </div>
                </div>
                <div class="table-container">
                    <table>
                        <thead>
                            <tr><th>Pemain</th><th>Umur</th><th>Posisi</th><th>SSB</th><th>Status</th><th>Aksi</th></tr>
                        </thead>
                        <tbody>
                            ${filteredSiswa.map((s, idx) => {
            const ssb = data.ssbs.find(i => i.id === s.ssbId);
            return `
                                    <tr class="fade-in" style="animation-delay: ${idx * 0.05}s">
                                        <td data-label="Pemain"><div class="player-info"><img src="${s.photo || ''}" class="player-photo"><span>${s.name}</span></div></td>
                                        <td data-label="Umur">${s.age} Thn</td>
                                        <td data-label="Posisi">${s.position}</td>
                                        <td data-label="SSB">${ssb ? ssb.name : '-'}</td>
                                        <td data-label="Status"><span style="color:${s.status === 'Aktif' ? 'var(--accent)' : 'var(--error)'}">${s.status}</span></td>
                                        <td data-label="Aksi">
                                            <button class="btn-sm btn-edit" onclick="App.showEditSiswa('${s.id}')">Edit</button>
                                            <button class="btn-sm btn-delete" onclick="App.deleteSiswa('${s.id}')">Hapus</button>
                                        </td>
                                    </tr>
                                `;
        }).join('')}
                        </tbody>
                    </table>
                </div>
            </div>
        `;
    },

    renderStatCard(title, value, delay) {
        return `<div class="stat-card glass fade-in" style="animation-delay: ${delay}"><h3>${title}</h3><div class="value">${value}</div></div>`;
    },

    renderFilter(label, key, options) {
        return `
            <div class="input-group" style="margin:0; flex: 1; min-width: 150px;">
                <label>${label}</label>
                <select onchange="App.setFilter('${key}', this.value)">${options}</select>
            </div>
        `;
    },

    updateNavUI(view) {
        document.querySelectorAll('.nav-link').forEach(link => {
            const dataView = link.dataset.view;
            const isActive = dataView === view || (dataView === 'siswa' && view === 'siswa-form') ||
                (dataView === 'jadwal-latihan' && view === 'latihan-form') ||
                (dataView === 'jadwal-turnamen' && view === 'turnamen-form') ||
                (dataView === 'ssb' && view === 'ssb-form');
            link.classList.toggle('active', isActive);
        });
    },

    toggleView(toShow, toHide) {
        const showEl = document.getElementById(toShow);
        const hideEl = document.getElementById(toHide);
        if (showEl) showEl.classList.remove('hidden');
        if (hideEl) hideEl.classList.add('hidden');
    },

    closeMobileMenu() {
        document.querySelector('.sidebar')?.classList.remove('open');
    },

    setFilter(key, value) {
        this.state.filters[key] = value;
        this.render();
    },

    handleLogin() {
        const user = document.getElementById('username')?.value;
        const pass = document.getElementById('password')?.value;
        if (Auth.login(user, pass)) this.showMainView();
        else document.getElementById('login-error')?.classList.remove('hidden');
    },

    handleImagePreview(input) {
        const file = input.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (f) => {
                this.state.tempPhoto = f.target.result;
                const preview = document.getElementById('photo-preview');
                const container = document.getElementById('photo-preview-container');
                if (preview) preview.src = this.state.tempPhoto;
                if (container) container.classList.remove('hidden');
            };
            reader.readAsDataURL(file);
        }
    },

    renderSSB() {
        const data = Store.getData();
        return `<div class="card glass slide-up"><button class="btn-sm btn-add" onclick="App.showAddSSB()">+ Tambah SSB</button><h3>Daftar SSB</h3>
                <div class="table-container"><table><thead><tr><th>Nama</th><th>Alamat</th><th>Aksi</th></tr></thead><tbody>
                ${data.ssbs.map((s, idx) => `<tr class="fade-in" style="animation-delay: ${idx * 0.05}s"><td data-label="Nama">${s.name}</td><td data-label="Alamat">${s.address}</td><td data-label="Aksi"><button class="btn-sm btn-edit" onclick="App.showEditSSB('${s.id}')">Edit</button><button class="btn-sm btn-delete" onclick="App.deleteSSB('${s.id}')">Hapus</button></td></tr>`).join('')}
                </tbody></table></div></div>`;
    },

    renderLatihan() {
        const data = Store.getData();
        return `<div class="card glass slide-up"><button class="btn-sm btn-add" onclick="App.showAddLatihan()">+ Tambah Jadwal</button><h3>Jadwal Latihan</h3>
                <div class="table-container"><table><thead><tr><th>Materi</th><th>Tanggal</th><th>Jam</th><th>SSB</th><th>Aksi</th></tr></thead><tbody>
                ${data.latihan.map((l, idx) => {
            const ssb = data.ssbs.find(i => i.id === l.ssbId);
            return `<tr class="fade-in" style="animation-delay: ${idx * 0.05}s"><td data-label="Materi">${l.title}</td><td data-label="Tanggal">${l.date}</td><td data-label="Jam">${l.time}</td><td data-label="SSB">${ssb ? ssb.name : '-'}</td><td data-label="Aksi"><button class="btn-sm btn-edit" onclick="App.showEditLatihan('${l.id}')">Edit</button><button class="btn-sm btn-delete" onclick="App.deleteLatihan('${l.id}')">Hapus</button></td></tr>`;
        }).join('')}
                </tbody></table></div></div>`;
    },

    renderTurnamen() {
        const data = Store.getData();
        return `<div class="card glass slide-up"><button class="btn-sm btn-add" onclick="App.showAddTurnamen()">+ Tambah Turnamen</button><h3>Jadwal Turnamen</h3>
                <div class="table-container"><table><thead><tr><th>Nama</th><th>Tanggal</th><th>Lokasi</th><th>Aksi</th></tr></thead><tbody>
                ${data.turnamen.map((t, idx) => `<tr class="fade-in" style="animation-delay: ${idx * 0.05}s"><td data-label="Nama">${t.title}</td><td data-label="Tanggal">${t.date}</td><td data-label="Lokasi">${t.venue}</td><td data-label="Aksi"><button class="btn-sm btn-edit" onclick="App.showEditTurnamen('${t.id}')">Edit</button><button class="btn-sm btn-delete" onclick="App.deleteTurnamen('${t.id}')">Hapus</button></td></tr>`).join('')}
                </tbody></table></div></div>`;
    },

    renderSiswaForm() {
        const data = Store.getData();
        let s = { name: '', age: '', position: 'FW', status: 'Aktif', ssbId: data.ssbs[0]?.id || '' };
        if (this.state.editingId.student) s = data.siswas.find(i => i.id === this.state.editingId.student) || s;
        const ssbOptions = data.ssbs.map(i => `<option value="${i.id}" ${i.id === s.ssbId ? 'selected' : ''}>${i.name}</option>`).join('');

        return `
            <div class="card glass slide-up" style="max-width: 900px; margin: 0 auto;">
                <div style="display:flex; justify-content: space-between; align-items: center; margin-bottom: 32px;">
                    <h3>${this.state.editingId.student ? 'Edit Data Pemain' : 'Tambah Pemain Baru'}</h3>
                    <button class="btn-sm" id="btn-cancel-siswa-form">Kembali</button>
                </div>
                <form id="student-form">
                    <div class="form-grid">
                        ${this.renderInput('Nama Lengkap', 's-name', s.name, 'text', true)}
                        ${this.renderInput('Umur', 's-age', s.age, 'number', true)}
                        <div class="input-group"><label>Posisi</label><select id="s-position"><option value="FW" ${s.position === 'FW' ? 'selected' : ''}>Forward</option><option value="MF" ${s.position === 'MF' ? 'selected' : ''}>Midfielder</option><option value="DF" ${s.position === 'DF' ? 'selected' : ''}>Defender</option><option value="GK" ${s.position === 'GK' ? 'selected' : ''}>Goalkeeper</option></select></div>
                        <div class="input-group"><label>SSB</label><select id="s-ssb">${ssbOptions}</select></div>
                        <div class="input-group"><label>Status</label><select id="s-status"><option value="Aktif" ${s.status === 'Aktif' ? 'selected' : ''}>Aktif</option><option value="Non-Aktif" ${s.status === 'Non-Aktif' ? 'selected' : ''}>Non-Aktif</option></select></div>
                        <div class="input-group full-width"><label>Foto</label><input type="file" id="s-photo" accept="image/*"><div id="photo-preview-container" class="preview-container ${this.state.tempPhoto ? '' : 'hidden'}"><img id="photo-preview" src="${this.state.tempPhoto}" style="width:100px; border-radius:10px;"></div></div>
                    </div>
                    <div style="margin-top:32px; display:flex; justify-content:flex-end;"><button type="submit" class="btn-primary" style="width:auto; padding: 12px 40px;">Simpan</button></div>
                </form>
            </div>
        `;
    },

    renderLatihanForm() {
        const data = Store.getData();
        let l = { title: '', date: '', time: '', ssbId: data.ssbs[0]?.id || '' };
        if (this.state.editingId.latihan) l = data.latihan.find(i => i.id === this.state.editingId.latihan) || l;
        const ssbOptions = data.ssbs.map(i => `<option value="${i.id}" ${i.id === l.ssbId ? 'selected' : ''}>${i.name}</option>`).join('');

        return `<div class="card glass slide-up" style="max-width: 800px; margin: 0 auto;"><div style="display:flex; justify-content: space-between; align-items: center; margin-bottom: 24px;"><h3>Jadwal Latihan</h3><button class="btn-sm" id="btn-cancel-latihan-form">Kembali</button></div>
                <form id="latihan-form"><div class="form-grid"><div class="input-group full-width"><label>Materi</label><input type="text" id="l-title" value="${l.title}" required></div><div class="input-group"><label>Tanggal</label><input type="date" id="l-date" value="${l.date}" required></div><div class="input-group"><label>Jam</label><input type="time" id="l-time" value="${l.time}" required></div><div class="input-group full-width"><label>SSB</label><select id="l-ssb">${ssbOptions}</select></div></div><div style="margin-top:24px; text-align:right;"><button type="submit" class="btn-primary" style="width:auto; padding: 12px 40px;">Simpan</button></div></form></div>`;
    },

    renderTurnamenForm() {
        let t = { title: '', date: '', venue: '' };
        if (this.state.editingId.turnamen) t = Store.getData().turnamen.find(i => i.id === this.state.editingId.turnamen) || t;
        return `<div class="card glass slide-up" style="max-width: 800px; margin: 0 auto;"><div style="display:flex; justify-content: space-between; align-items: center; margin-bottom: 24px;"><h3>Jadwal Turnamen</h3><button class="btn-sm" id="btn-cancel-turnamen-form">Kembali</button></div>
                <form id="turnamen-form"><div class="form-grid"><div class="input-group full-width"><label>Turnamen</label><input type="text" id="t-title" value="${t.title}" required></div><div class="input-group"><label>Tanggal</label><input type="date" id="t-date" value="${t.date}" required></div><div class="input-group"><label>Lokasi</label><input type="text" id="t-venue" value="${t.venue}" required></div></div><div style="margin-top:24px; text-align:right;"><button type="submit" class="btn-primary" style="width:auto; padding: 12px 40px;">Simpan</button></div></form></div>`;
    },

    renderSSBForm() {
        let ssb = { name: '', address: '' };
        if (this.state.editingId.ssb) ssb = Store.getData().ssbs.find(i => i.id === this.state.editingId.ssb) || ssb;
        return `<div class="card glass slide-up" style="max-width: 800px; margin: 0 auto;"><div style="display:flex; justify-content: space-between; align-items: center; margin-bottom: 24px;"><h3>Manajemen SSB</h3><button class="btn-sm" id="btn-cancel-ssb-form">Kembali</button></div>
                <form id="ssb-form"><div class="form-grid"><div class="input-group full-width"><label>Nama SSB</label><input type="text" id="ssb-name" value="${ssb.name}" required></div><div class="input-group full-width"><label>Alamat</label><input type="text" id="ssb-address" value="${ssb.address}" required></div></div><div style="margin-top:24px; text-align:right;"><button type="submit" class="btn-primary" style="width:auto; padding: 12px 40px;">Simpan</button></div></form></div>`;
    },

    renderInput(label, id, value, type = 'text', required = false) {
        return `<div class="input-group"><label>${label}</label><input type="${type}" id="${id}" value="${value || ''}" ${required ? 'required' : ''}></div>`;
    },

    showAddSiswa() { this.state.editingId.student = null; this.state.tempPhoto = ''; this.switchView('siswa-form'); },
    showEditSiswa(id) { this.state.editingId.student = id; this.state.tempPhoto = Store.getData().siswas.find(i => i.id === id)?.photo || ''; this.switchView('siswa-form'); },
    showAddLatihan() { this.state.editingId.latihan = null; this.switchView('latihan-form'); },
    showEditLatihan(id) { this.state.editingId.latihan = id; this.switchView('latihan-form'); },
    showAddTurnamen() { this.state.editingId.turnamen = null; this.switchView('turnamen-form'); },
    showEditTurnamen(id) { this.state.editingId.turnamen = id; this.switchView('turnamen-form'); },
    showAddSSB() { this.state.editingId.ssb = null; this.switchView('ssb-form'); },
    showEditSSB(id) { this.state.editingId.ssb = id; this.switchView('ssb-form'); },

    handleStudentSubmit() {
        const student = { name: document.getElementById('s-name').value, age: parseInt(document.getElementById('s-age').value), position: document.getElementById('s-position').value, ssbId: document.getElementById('s-ssb').value, status: document.getElementById('s-status').value, photo: this.state.tempPhoto };
        this.state.editingId.student ? Store.updateEntity('siswas', this.state.editingId.student, student) : Store.addEntity('siswas', student);
        this.switchView('siswa');
    },

    handleLatihanSubmit() {
        const latihan = { title: document.getElementById('l-title').value, date: document.getElementById('l-date').value, time: document.getElementById('l-time').value, ssbId: document.getElementById('l-ssb').value };
        this.state.editingId.latihan ? Store.updateEntity('latihan', this.state.editingId.latihan, latihan) : Store.addEntity('latihan', latihan);
        this.switchView('jadwal-latihan');
    },

    handleTurnamenSubmit() {
        const turnamen = { title: document.getElementById('t-title').value, date: document.getElementById('t-date').value, venue: document.getElementById('t-venue').value };
        this.state.editingId.turnamen ? Store.updateEntity('turnamen', this.state.editingId.turnamen, turnamen) : Store.addEntity('turnamen', turnamen);
        this.switchView('jadwal-turnamen');
    },

    handleSSBSubmit() {
        const ssb = { name: document.getElementById('ssb-name').value, address: document.getElementById('ssb-address').value };
        this.state.editingId.ssb ? Store.updateEntity('ssbs', this.state.editingId.ssb, ssb) : Store.addEntity('ssbs', ssb);
        this.switchView('ssb');
    },

    deleteSiswa(id) { if (confirm('Hapus siswa?')) { Store.deleteEntity('siswas', id); this.render(); } },
    deleteLatihan(id) { if (confirm('Hapus jadwal?')) { Store.deleteEntity('latihan', id); this.render(); } },
    deleteTurnamen(id) { if (confirm('Hapus turnamen?')) { Store.deleteEntity('turnamen', id); this.render(); } },
    deleteSSB(id) { if (confirm('Hapus SSB?')) { Store.deleteEntity('ssbs', id); this.render(); } },

    exportSiswaToPDF() {
        const { jsPDF } = window.jspdf;
        const doc = new jsPDF();
        const data = Store.getData();
        const user = Auth.currentUser;

        doc.setFontSize(18); doc.text("Daftar Pemain SSB Digital", 14, 22);
        doc.setFontSize(12); doc.text(`Oleh: ${user.username} - ${new Date().toLocaleDateString()}`, 14, 30);

        const body = data.siswas.map(s => [s.name, s.age, s.position, data.ssbs.find(i => i.id === s.ssbId)?.name || '-', s.status]);
        doc.autoTable({ startY: 40, head: [['Nama', 'Umur', 'Posisi', 'SSB', 'Status']], body, theme: 'grid' });
        doc.save(`pemain_${Date.now()}.pdf`);
    }
};

window.App = App;
document.addEventListener('DOMContentLoaded', () => App.init());
