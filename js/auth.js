/* AUTH MODULE - v1.1 [Feature: Global Animation Ready] */
const Auth = {
    currentUser: null,

    login(username, password) {
        if (username === 'manager' || username === 'admin') {
            const role = 'Manager Paguyuban';
            this.currentUser = { username, role, ssbId: null };
            localStorage.setItem('ssb_user', JSON.stringify(this.currentUser));
            return true;
        }
        return false;
    },

    logout() {
        this.currentUser = null;
        localStorage.removeItem('ssb_user');
        window.location.reload();
    },

    checkSession() {
        const savedUser = localStorage.getItem('ssb_user');
        if (savedUser) {
            this.currentUser = JSON.parse(savedUser);
            return true;
        }
        return false;
    }
};

window.Auth = Auth;
