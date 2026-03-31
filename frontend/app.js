// ==========================================
// KÜRESEL DEĞİŞKENLER VE YARDIMCILAR
// ==========================================
let allCampaigns = [];
let currentCategory = 'Tümü';
let searchQuery = '';
let authActionFlow = '';

let currentPage = 1;
let totalPages = 1;
let isFetching = false;

window.toggleModal = function (modalID) {
    const modal = document.getElementById(modalID);
    if (!modal) return;

    const modalContent = modal.querySelector('div');
    if (modal.classList.contains('hidden')) {
        modal.classList.remove('hidden');
        setTimeout(() => {
            modal.classList.remove('opacity-0');
            modalContent.classList.remove('scale-95');
        }, 10);
    } else {
        modal.classList.add('opacity-0');
        modalContent.classList.add('scale-95');
        setTimeout(() => modal.classList.add('hidden'), 300);
    }
};

window.toggleTheme = function () {
    const body = document.body;
    const themeBtn = document.getElementById('themeToggleBtn');
    const icon = themeBtn ? themeBtn.querySelector('i') : null;

    if (body.classList.contains('dark-mode')) {
        body.classList.remove('dark-mode');
        localStorage.setItem('theme', 'light');
        if (icon) icon.className = 'fa-solid fa-moon text-lg text-slate-500';
    } else {
        body.classList.add('dark-mode');
        localStorage.setItem('theme', 'dark');
        if (icon) icon.className = 'fa-solid fa-sun text-lg text-amber-400';
    }
};

document.addEventListener('DOMContentLoaded', () => {
    const themeBtn = document.getElementById('themeToggleBtn');
    if (themeBtn) {
        const icon = themeBtn.querySelector('i');
        if (document.body.classList.contains('dark-mode')) {
            icon.className = 'fa-solid fa-sun text-lg text-amber-400';
        }
    }
});

window.showToast = function (message, type = 'success') {
    const container = document.getElementById('toastContainer') || document.body;
    const toast = document.createElement('div');
    toast.className = `fixed top-4 right-4 px-6 py-3 rounded-xl text-white font-bold z-[100] transition-all duration-300 shadow-lg transform translate-x-0 flex items-center gap-3 ${type === 'success' ? 'bg-emerald-500' : (type === 'warning' ? 'bg-amber-500' : 'bg-red-500')}`;
    let icon = '<i class="fa-solid fa-circle-exclamation text-xl"></i>';
    if (type === 'success') icon = '<i class="fa-solid fa-check-circle text-xl"></i>';
    else if (type === 'warning') icon = '<i class="fa-solid fa-triangle-exclamation text-xl"></i>';
    toast.innerHTML = `${icon} <span>${message}</span>`;
    container.appendChild(toast);
    setTimeout(() => { toast.style.opacity = '0'; toast.style.transform = 'translateY(-10px)'; setTimeout(() => toast.remove(), 300); }, 3000);
};

// ==========================================
// 🔥 GERÇEK ZAMANLI (REAL-TIME) SOCKET.IO MOTORU 🔥
// ==========================================
const socket = typeof io !== 'undefined' ? io() : null;

if (socket) {
    socket.on('connect', () => {
        const userStr = localStorage.getItem('takasUser') || sessionStorage.getItem('takasUser');
        if (userStr) {
            socket.emit('register', JSON.parse(userStr)._id);
        }
    });

    socket.on('realtime_notification', (data) => {
        showToast(`<strong>${data.title}</strong><br>${data.message}`, data.type);
        loadNotifications(false);

        if (data.newBalance !== undefined) {
            const balanceBtn = document.getElementById('headerBalance');
            if (balanceBtn) {
                balanceBtn.innerHTML = `<i class="fa-solid fa-coins text-amber-500 text-xl"></i> <span id="headerBalanceText" class="credit-text-sharp text-lg">${data.newBalance}</span>`;
                balanceBtn.classList.add('scale-110');
                setTimeout(() => balanceBtn.classList.remove('scale-110'), 1000);
            }

            const userStr = localStorage.getItem('takasUser') || sessionStorage.getItem('takasUser');
            if (userStr) {
                let userObj = JSON.parse(userStr);
                userObj.balance = data.newBalance;
                if (localStorage.getItem('takasUser')) localStorage.setItem('takasUser', JSON.stringify(userObj));
                else sessionStorage.setItem('takasUser', JSON.stringify(userObj));
            }

            const creditAmount = document.getElementById('userCreditAmount');
            if (creditAmount) creditAmount.textContent = data.newBalance;
        }
    });
}

// ==========================================
// KİMLİK DOĞRULAMA (AUTH) MOTORU
// ==========================================
window.togglePassword = function (inputId, iconId) {
    const input = document.getElementById(inputId);
    const icon = document.getElementById(iconId);
    if (input.type === 'password') {
        input.type = 'text';
        icon.classList.remove('fa-eye'); icon.classList.add('fa-eye-slash');
    } else {
        input.type = 'password';
        icon.classList.remove('fa-eye-slash'); icon.classList.add('fa-eye');
    }
};

window.switchAuthView = function (view) {
    const views = ['loginView', 'registerView', 'otpView', 'forgotView', 'resetView'];
    views.forEach(v => {
        const el = document.getElementById(v);
        if (el) el.classList.add('hidden');
    });

    const tabs = document.getElementById('authTabs');
    if (view === 'login' || view === 'register') {
        if (tabs) tabs.classList.remove('hidden');
        if (document.getElementById('tabLogin')) document.getElementById('tabLogin').className = view === 'login' ? "flex-1 py-2.5 text-sm font-bold rounded-xl bg-white text-indigo-600 shadow-sm transition-all duration-300" : "flex-1 py-2.5 text-sm font-bold rounded-xl text-slate-500 hover:text-slate-800 transition-all duration-300";
        if (document.getElementById('tabRegister')) document.getElementById('tabRegister').className = view === 'register' ? "flex-1 py-2.5 text-sm font-bold rounded-xl bg-white text-indigo-600 shadow-sm transition-all duration-300" : "flex-1 py-2.5 text-sm font-bold rounded-xl text-slate-500 hover:text-slate-800 transition-all duration-300";
    } else {
        if (tabs) tabs.classList.add('hidden');
    }

    const targetView = document.getElementById(view + 'View');
    if (targetView) targetView.classList.remove('hidden');
};

window.checkAuth = async function () {
    const token = localStorage.getItem('takasToken') || sessionStorage.getItem('takasToken');
    const userStr = localStorage.getItem('takasUser') || sessionStorage.getItem('takasUser');
    const navButtons = document.getElementById('navButtonsContainer');

    if (token && userStr && navButtons) {
        const user = JSON.parse(userStr);

        if (typeof socket !== 'undefined' && socket && user._id) {
            socket.emit('register', user._id);
        }

        navButtons.innerHTML = `
           <button id="headerBalance" onclick="openTransactionHistory()" class="flex items-center gap-1.5 hover:scale-105 transition-transform px-2">
                <i class="fa-solid fa-coins text-amber-500 text-xl"></i> 
                <span id="headerBalanceText" class="credit-text-sharp text-lg">${user.balance}</span>
            </button>
            <div class="hidden sm:block w-px h-5 bg-slate-200 dark:bg-slate-700 mx-2"></div>

            <button id="themeToggleBtn" onclick="toggleTheme()" class="text-slate-400 hover:text-indigo-500 dark:hover:text-indigo-400 transition-colors w-9 h-9 flex items-center justify-center rounded-full hover:bg-slate-50 dark:hover:bg-slate-800/50">
                <i class="fa-solid fa-moon text-lg"></i>
            </button>

            <button onclick="openNotificationSidebar()" class="hidden md:flex relative text-slate-400 hover:text-indigo-500 dark:hover:text-indigo-400 transition-colors w-9 h-9 items-center justify-center rounded-full hover:bg-slate-50 dark:hover:bg-slate-800/50">
                <i class="fa-solid fa-bell text-xl"></i>
                <span id="notifBadge" class="absolute top-1.5 right-1.5 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-white dark:border-[#161f33] hidden"></span>
            </button>

            <button onclick="toggleModal('profileModal'); loadProfileData();" class="hidden md:flex w-9 h-9 bg-indigo-100 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-300 rounded-full items-center justify-center text-sm font-bold hover:ring-2 ring-indigo-500/30 transition-all ml-1" title="Profil">
                ${user.name ? user.name.charAt(0).toUpperCase() : 'U'}
            </button>

            <button onclick="toggleModal('addCampaignModal')" class="hidden md:flex bg-slate-800 dark:bg-indigo-600 text-white w-9 h-9 rounded-xl font-bold hover:bg-slate-900 dark:hover:bg-indigo-700 transition-all items-center justify-center ml-3" title="İlan Yükle">
                <i class="fa-solid fa-plus"></i>
            </button>
        `;

        try {
            const response = await fetch('/api/auth/me', { headers: { 'Authorization': `Bearer ${token}` } });
            if (response.ok) {
                const freshUser = await response.json();
                if (freshUser.balance !== user.balance) {
                    user.balance = freshUser.balance;
                    if (localStorage.getItem('takasUser')) localStorage.setItem('takasUser', JSON.stringify(user));
                    else sessionStorage.setItem('takasUser', JSON.stringify(user));

                    const balanceEl = document.getElementById('headerBalanceText');
                    if (balanceEl) balanceEl.innerText = freshUser.balance;
                }
            }
        } catch (err) { console.log("Senkronizasyon hatası:", err); }

    } else if (navButtons) {
        navButtons.innerHTML = `
            <button id="themeToggleBtn" onclick="toggleTheme()" class="text-slate-400 hover:text-indigo-500 transition-colors w-9 h-9 flex items-center justify-center rounded-full hover:bg-slate-50 mr-2">
                <i class="fa-solid fa-moon text-lg"></i>
            </button>
            <button onclick="toggleModal('authModal'); switchAuthView('login');" class="hidden sm:block text-slate-500 font-semibold hover:text-slate-900 dark:hover:text-white px-3 py-2 transition-colors text-sm">
                Giriş
            </button>
            <button onclick="toggleModal('authModal'); switchAuthView('register');" class="bg-slate-800 dark:bg-indigo-600 text-white px-5 py-2 rounded-xl font-bold hover:bg-slate-900 dark:hover:bg-indigo-700 transition-all text-sm ml-2">
                Başla
            </button>
        `;
    }
};

window.logout = function () {
    localStorage.removeItem('takasToken'); localStorage.removeItem('takasUser');
    sessionStorage.removeItem('takasToken'); sessionStorage.removeItem('takasUser');
    window.location.reload();
};

function saveAuthData(data) {
    const remember = document.getElementById('rememberMe') ? document.getElementById('rememberMe').checked : true;
    const storage = remember ? localStorage : sessionStorage;
    localStorage.removeItem('takasToken'); localStorage.removeItem('takasUser');
    sessionStorage.removeItem('takasToken'); sessionStorage.removeItem('takasUser');
    storage.setItem('takasToken', data.token);
    storage.setItem('takasUser', JSON.stringify(data));

    if (typeof socket !== 'undefined' && socket && data._id) {
        socket.emit('register', data._id);
    }
}

window.handleGoogleCallback = async function (response) {
    try {
        const res = await fetch('/api/auth/google', {
            method: 'POST', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ credential: response.credential })
        });
        const data = await res.json();
        if (res.ok) {
            saveAuthData(data); showToast('Google ile giriş yapıldı!', 'success'); window.location.reload();
        } else { showToast(data.message, 'error'); }
    } catch (error) { showToast('Google bağlantı hatası.', 'error'); }
};

// ==========================================
// VİTRİN VE İLANLAR
// ==========================================
window.loadCampaigns = async function (page = 1, append = false) {
    if (isFetching) return;
    isFetching = true;

    const grid = document.getElementById('couponGrid');

    if (!append && grid) {
        const skeletonCard = `
            <div class="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 relative overflow-hidden">
                <div class="animate-pulse flex flex-col h-full">
                    <div class="flex justify-between items-start mb-4">
                        <div class="flex items-center gap-4"><div class="w-12 h-12 bg-slate-200 rounded-full"></div><div><div class="h-4 bg-slate-200 rounded w-24 mb-2"></div><div class="h-3 bg-slate-200 rounded w-16"></div></div></div>
                        <div class="w-14 h-6 bg-slate-200 rounded-full"></div>
                    </div>
                    <div class="h-4 bg-slate-200 rounded w-3/4 mb-3 mt-2"></div>
                    <div class="h-4 bg-slate-200 rounded w-1/2 mb-6"></div>
                    <div class="h-12 bg-slate-200 rounded-xl mb-4"></div>
                    <div class="h-10 bg-slate-200 rounded-xl w-full mt-auto"></div>
                </div>
            </div>
        `;
        grid.innerHTML = Array(6).fill(skeletonCard).join('');
    }
    let loadingIndicator;
    if (append && grid) {
        loadingIndicator = document.createElement('div');
        loadingIndicator.className = 'w-full col-span-full flex justify-center py-6';
        loadingIndicator.id = 'infiniteLoader';
        loadingIndicator.innerHTML = '<i class="fa-solid fa-circle-notch fa-spin text-indigo-400 text-3xl"></i>';
        grid.appendChild(loadingIndicator);
    }

    try {
        const url = `/api/campaigns?page=${page}&limit=12&category=${encodeURIComponent(currentCategory)}&search=${encodeURIComponent(searchQuery)}`;
        const response = await fetch(url);
        const data = await response.json();

        if (append && loadingIndicator) loadingIndicator.remove();
        if (!append && grid) grid.innerHTML = '';

        if (data.campaigns.length === 0 && !append) {
            grid.innerHTML = '<p class="text-center w-full col-span-full text-slate-500 py-10 font-medium">Bu kriterlere uygun ilan bulunamadı.</p>';
        } else {
            renderCampaigns(data.campaigns);
        }

        currentPage = data.currentPage || 1;
        totalPages = data.totalPages || 1;

    } catch (error) {
        if (append && loadingIndicator) loadingIndicator.remove();
        if (!append && grid) grid.innerHTML = '<p class="text-center w-full col-span-full text-red-500 py-10"><i class="fa-solid fa-triangle-exclamation mb-2 text-xl"></i><br>Bağlantı hatası.</p>';
    } finally {
        isFetching = false;
    }
};

function renderCampaigns(campaignsToShow) {
    const grid = document.getElementById('couponGrid');
    if (!grid) return;

    const categoryStyles = {
        'Akaryakıt': { icon: 'fa-gas-pump', bg: 'bg-orange-100', text: 'text-orange-600', badge: 'bg-blue-100 text-blue-700' },
        'Giyim': { icon: 'fa-shirt', bg: 'bg-pink-100', text: 'text-pink-600', badge: 'bg-red-100 text-red-700' },
        'Eğlence': { icon: 'fa-ticket', bg: 'bg-blue-100', text: 'text-blue-600', badge: 'bg-yellow-100 text-yellow-700' },
        'Market': { icon: 'fa-basket-shopping', bg: 'bg-emerald-100', text: 'text-emerald-600', badge: 'bg-blue-100 text-blue-700' },
        'Yemek': { icon: 'fa-burger', bg: 'bg-red-100', text: 'text-red-600', badge: 'bg-orange-100 text-orange-700' },
        'İnternet/Dakika': { icon: 'fa-wifi', bg: 'bg-indigo-100', text: 'text-indigo-600', badge: 'bg-yellow-100 text-yellow-700' },
        'Diğer': { icon: 'fa-tag', bg: 'bg-slate-100', text: 'text-slate-600', badge: 'bg-slate-100 text-slate-700' }
    };

    campaignsToShow.forEach(camp => {
        const style = categoryStyles[camp.category] || categoryStyles['Diğer'];
        const formattedDate = new Date(camp.expiryDate).toLocaleDateString('tr-TR');

        const expireDate = new Date(camp.expiryDate);
        const today = new Date();
        const daysLeft = Math.ceil((expireDate - today) / (1000 * 60 * 60 * 24));

        let urgencyBadge = '';
        if (daysLeft <= 3 && daysLeft > 0) {
            urgencyBadge = `<div class="absolute -top-3 -left-3 bg-gradient-to-tr from-rose-500 to-red-600 text-white text-[10px] sm:text-xs font-black uppercase tracking-wider px-3 sm:px-4 py-1.5 rounded-full shadow-lg shadow-rose-500/40 flex items-center gap-1.5 z-20 animate-pulse-glow border-2 border-white dark:border-[#161f33]"><i class="fa-solid fa-fire text-yellow-300"></i> Son ${daysLeft} Gün</div>`;
        } else if (daysLeft === 0) {
            urgencyBadge = `<div class="absolute -top-3 -left-3 bg-gradient-to-tr from-rose-500 to-red-600 text-white text-[10px] sm:text-xs font-black uppercase tracking-wider px-3 sm:px-4 py-1.5 rounded-full shadow-lg shadow-rose-500/40 flex items-center gap-1.5 z-20 animate-pulse-glow border-2 border-white dark:border-[#161f33]"><i class="fa-solid fa-fire text-yellow-300"></i> Bugün Bitiyor!</div>`;
        }

        const card = document.createElement('div');
        card.className = 'bg-white rounded-2xl p-6 shadow-sm border border-slate-100 relative group transition-all duration-300 hover:shadow-md hover:-translate-y-1 animate-fade-in flex flex-col h-full';

        card.innerHTML = `
            ${urgencyBadge}
            <div class="absolute top-4 right-4 ${style.badge} text-xs font-bold px-3 py-1 rounded-full shadow-sm">Güven: ${camp.owner ? camp.owner.trustScore : 100}</div>
            <div class="flex items-center gap-4 mb-4 relative z-10 mt-1">
                <div class="w-12 h-12 ${style.bg} rounded-full flex items-center justify-center ${style.text} text-xl shrink-0"><i class="fa-solid ${style.icon}"></i></div>
                <div><h3 class="font-bold text-lg text-slate-800">${camp.brand}</h3><p class="text-xs text-slate-500 font-medium">Son Gün: ${formattedDate}</p></div>
            </div>
            <p class="font-medium text-slate-700 mb-4 min-h-[48px] line-clamp-2">${camp.title}</p>
            <div class="mt-auto">
                <div class="bg-slate-50 border border-slate-100 p-3 rounded-xl flex justify-between items-center mb-4"><span class="font-mono font-bold text-lg text-slate-800 tracking-widest blurred-code">••••••••</span><i class="fa-solid fa-lock text-slate-400"></i></div>
                <button onclick="buyCode('${camp._id}')" class="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2.5 px-4 rounded-xl shadow-sm transition active:scale-95">Takas Et (1 Kredi)</button>
            </div>
        `;
        grid.appendChild(card);
    });
}

// ==========================================
// ÇELİK KASA SATIN ALMA
// ==========================================
let campaignToBuyId = null;

window.buyCode = function (campaignId) {
    const token = localStorage.getItem('takasToken') || sessionStorage.getItem('takasToken');
    if (!token) {
        showToast('Satın almak için giriş yapmalısınız.', 'error');
        toggleModal('authModal'); switchAuthView('login');
        return;
    }
    campaignToBuyId = campaignId;
    toggleModal('buyConfirmModal');
};

document.addEventListener('DOMContentLoaded', () => {
    const confirmBuyBtn = document.getElementById('confirmBuyBtn');
    if (confirmBuyBtn) {
        confirmBuyBtn.addEventListener('click', async () => {
            if (!campaignToBuyId) return;

            const originalText = confirmBuyBtn.innerHTML;
            confirmBuyBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> İşleniyor...';
            confirmBuyBtn.disabled = true;

            const token = localStorage.getItem('takasToken') || sessionStorage.getItem('takasToken');

            try {
                const response = await fetch(`/api/campaigns/${campaignToBuyId}/trade`, {
                    method: 'POST', headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' }
                });
                const data = await response.json();

                if (response.ok) {
                    window.lastBoughtCampaignId = campaignToBuyId;
                    let user = JSON.parse(localStorage.getItem('takasUser') || sessionStorage.getItem('takasUser'));
                    user.balance = data.newBalance;
                    if (localStorage.getItem('takasUser')) localStorage.setItem('takasUser', JSON.stringify(user));
                    else sessionStorage.setItem('takasUser', JSON.stringify(user));

                    checkAuth(); loadCampaigns(); toggleModal('buyConfirmModal');

                    const resultModal = document.getElementById('tradeResultModal');
                    if (resultModal) {
                        document.getElementById('secretCodeBox').textContent = data.secretCode;
                        toggleModal('tradeResultModal');
                    }
                    if (typeof confetti !== 'undefined') confetti({ particleCount: 150, spread: 80, origin: { y: 0.6 } });
                } else {
                    showToast(data.message, 'error');
                    toggleModal('buyConfirmModal');
                }
            } catch (error) {
                showToast('Sunucu bağlantı hatası.', 'error');
                toggleModal('buyConfirmModal');
            } finally {
                confirmBuyBtn.innerHTML = originalText;
                confirmBuyBtn.disabled = false;
                campaignToBuyId = null;
            }
        });
    }
});

// ==========================================
// PROFIL MODALI
// ==========================================
window.switchProfileTab = function (tab) {
    const tabUploadsBtn = document.getElementById('tabUploads');
    const tabPurchasesBtn = document.getElementById('tabPurchases');
    const contentUploads = document.getElementById('contentUploads');
    const contentPurchases = document.getElementById('contentPurchases');
    const activeClasses = ['bg-white', 'text-indigo-600', 'shadow-sm'];
    const inactiveClasses = ['text-slate-500', 'hover:text-slate-800'];

    if (!tabUploadsBtn || !tabPurchasesBtn || !contentUploads || !contentPurchases) return;

    if (tab === 'uploads') {
        contentUploads.classList.remove('hidden'); contentPurchases.classList.add('hidden');
        tabUploadsBtn.classList.remove(...inactiveClasses); tabUploadsBtn.classList.add(...activeClasses);
        tabPurchasesBtn.classList.remove(...activeClasses); tabPurchasesBtn.classList.add(...inactiveClasses);
    } else if (tab === 'purchases') {
        contentPurchases.classList.remove('hidden'); contentUploads.classList.add('hidden');
        tabPurchasesBtn.classList.remove(...inactiveClasses); tabPurchasesBtn.classList.add(...activeClasses);
        tabUploadsBtn.classList.remove(...activeClasses); tabUploadsBtn.classList.add(...inactiveClasses);
    }
};

window.loadProfileData = async function () {
    const userStr = localStorage.getItem('takasUser') || sessionStorage.getItem('takasUser');
    const token = localStorage.getItem('takasToken') || sessionStorage.getItem('takasToken');
    if (!userStr || !token) return;

    const user = JSON.parse(userStr);
    const profileImage = document.getElementById('userProfileImage');
    const profileName = document.getElementById('userProfileName');
    const profileEmail = document.getElementById('userProfileEmail');
    const creditAmount = document.getElementById('userCreditAmount');

    const avatarUrl = user.avatar ? `/${user.avatar}` : `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name)}&background=4f46e5&color=fff&size=128`;

    if (profileImage) profileImage.src = avatarUrl;
    if (profileName) profileName.textContent = user.name || 'Kullanıcı';
    if (profileEmail) profileEmail.textContent = user.email || 'kullanici@mail.com';
    if (creditAmount) creditAmount.textContent = user.balance || 0;

    switchProfileTab('uploads');

    try {
        const cUploads = document.getElementById('contentUploads');
        const cPurchases = document.getElementById('contentPurchases');
        const listSkeleton = `<div class="flex gap-4 p-4 border border-slate-100 rounded-2xl bg-white items-center overflow-hidden"><div class="animate-pulse w-14 h-14 bg-slate-200 rounded-xl shrink-0"></div><div class="animate-pulse flex-1 py-1"><div class="flex justify-between items-start mb-2"><div class="h-4 bg-slate-200 rounded w-1/3"></div><div class="h-4 bg-slate-200 rounded w-12"></div></div><div class="h-3 bg-slate-200 rounded w-1/2 mb-2"></div><div class="h-2 bg-slate-200 rounded w-1/4"></div></div></div>`;
        if (cUploads) cUploads.innerHTML = Array(4).fill(listSkeleton).join('');
        if (cPurchases) cPurchases.innerHTML = Array(4).fill(listSkeleton).join('');

        const res = await fetch('/api/campaigns/profile-data', { headers: { 'Authorization': `Bearer ${token}` } });
        if (res.ok) {
            const data = await res.json();
            renderUserUploads(data.uploads || []);
            renderUserPurchases(data.purchases || []);
        } else throw new Error('Veriler alınamadı');
    } catch (error) {
        if (document.getElementById('contentUploads')) document.getElementById('contentUploads').innerHTML = '<div class="py-6 text-center text-red-500 text-sm"><i class="fa-solid fa-triangle-exclamation mb-2 text-xl"></i><br>Bağlantı hatası oluştu.</div>';
        if (document.getElementById('contentPurchases')) document.getElementById('contentPurchases').innerHTML = '<div class="py-6 text-center text-red-500 text-sm"><i class="fa-solid fa-triangle-exclamation mb-2 text-xl"></i><br>Bağlantı hatası oluştu.</div>';
    }
};

function renderUserUploads(uploads) {
    const container = document.getElementById('contentUploads');
    if (!container) return;

    if (uploads.length === 0) {
        container.innerHTML = `<div class="flex flex-col items-center justify-center h-full text-center mt-6 p-6"><div class="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mb-4 border-2 border-dashed border-slate-200"><i class="fa-solid fa-cloud-arrow-up text-2xl text-slate-300"></i></div><h4 class="text-lg font-bold text-slate-700 mb-1">Henüz İlan Yüklemedin</h4><p class="text-sm text-slate-500 max-w-xs mx-auto mb-4">Kullanmadığın kampanyaları yükleyerek kredi kazanmaya başla.</p><button onclick="toggleModal('profileModal'); toggleModal('addCampaignModal');" class="px-6 py-2 bg-indigo-50 text-indigo-600 font-bold rounded-xl hover:bg-indigo-100 transition-colors shadow-sm">İlk İlanını Yükle</button></div>`;
        return;
    }

    container.innerHTML = uploads.map(item => `
        <div class="flex gap-4 p-4 border border-slate-100 rounded-2xl bg-white hover:border-indigo-200 hover:shadow-md transition-all duration-300 group cursor-default items-center">
            <div class="w-14 h-14 bg-slate-50 text-slate-500 rounded-xl flex items-center justify-center text-xl shrink-0 group-hover:bg-indigo-50 group-hover:text-indigo-600 transition-colors"><i class="fa-solid fa-tag"></i></div>
            <div class="flex-1 py-1 min-w-0">
                <div class="flex justify-between items-start mb-1 gap-2"><h4 class="font-bold text-slate-800 truncate">${item.brand}</h4><span class="text-[10px] font-bold px-2 py-0.5 rounded-md shrink-0 ${item.isSold ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}">${item.isSold ? 'Satıldı' : 'Yayında'}</span></div>
                <p class="text-sm text-slate-500 truncate mb-1">${item.title}</p>
                <p class="text-xs text-slate-400 font-medium">Son Gün: ${new Date(item.expiryDate).toLocaleDateString('tr-TR')}</p>
            </div>
            ${!item.isSold ? `<button onclick="deleteCampaign('${item._id}')" class="w-10 h-10 rounded-full bg-slate-50 border border-transparent text-slate-400 hover:text-red-500 hover:bg-red-50 hover:border-red-100 flex items-center justify-center transition-all opacity-0 group-hover:opacity-100" title="İlanı Sil"><i class="fa-solid fa-trash-can"></i></button>` : ''}
        </div>
    `).join('');
}

function renderUserPurchases(purchases) {
    const container = document.getElementById('contentPurchases');
    if (!container) return;

    if (purchases.length === 0) {
        container.innerHTML = `<div class="flex flex-col items-center justify-center h-full text-center mt-6 p-6"><div class="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mb-4 border-2 border-dashed border-slate-200"><i class="fa-solid fa-ticket-simple text-3xl text-slate-300"></i></div><h4 class="text-lg font-bold text-slate-700 mb-1">Henüz Kod Almadın</h4><p class="text-sm text-slate-500 max-w-xs mx-auto mb-4">Havuzdan kredi kullanarak aldığın kampanyalar burada listelenecek.</p><button onclick="toggleModal('profileModal')" class="px-6 py-2 bg-indigo-50 text-indigo-600 font-bold rounded-xl hover:bg-indigo-100 transition-colors shadow-sm">Havuza Göz At</button></div>`;
        return;
    }

    container.innerHTML = purchases.map(item => {
        let reportButtonHtml = '';
        if (item.reportStatus === 'pending') {
            reportButtonHtml = `<button class="w-8 h-8 rounded-full bg-orange-50 border border-orange-200 text-orange-400 flex items-center justify-center shadow-sm cursor-not-allowed" title="Şikayet İncelemede"><i class="fa-solid fa-clock"></i></button>`;
        } else if (item.reportStatus === 'rejected') {
            reportButtonHtml = `<button class="w-8 h-8 rounded-full bg-slate-100 border border-slate-200 text-slate-400 flex items-center justify-center shadow-sm cursor-not-allowed" title="Şikayet Reddedildi"><i class="fa-solid fa-ban"></i></button>`;
        } else if (item.reportStatus === 'approved') {
            reportButtonHtml = `<button class="w-8 h-8 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-500 flex items-center justify-center shadow-sm cursor-not-allowed" title="Şikayet Haklı Bulundu"><i class="fa-solid fa-check-double"></i></button>`;
        } else {
            reportButtonHtml = `<button onclick="openReportModalFromProfile('${item._id}')" class="w-8 h-8 rounded-full bg-white border border-slate-200 text-slate-400 hover:text-red-500 hover:border-red-200 flex items-center justify-center transition-all shadow-sm" title="Sorun Bildir"><i class="fa-solid fa-triangle-exclamation"></i></button>`;
        }

        return `
        <div class="flex gap-4 p-4 border border-emerald-100 rounded-2xl bg-emerald-50/30 hover:bg-emerald-50 hover:shadow-md transition-all duration-300 group cursor-default">
            <div class="w-14 h-14 bg-emerald-100 text-emerald-600 rounded-xl flex items-center justify-center text-xl shrink-0"><i class="fa-solid fa-unlock-keyhole"></i></div>
            <div class="flex-1 py-1 min-w-0">
                <h4 class="font-bold text-slate-800 truncate mb-1">${item.brand}</h4><p class="text-xs text-slate-500 truncate mb-2">${item.title}</p>
                <div class="flex items-center justify-between gap-2">
                    <span class="font-mono font-bold text-indigo-700 bg-white border border-indigo-100 px-3 py-1 rounded-lg text-sm select-all tracking-wider shadow-sm">${item.code}</span>
                    <div class="flex gap-1.5"><button onclick="copySecretCode('${item.code}', this)" class="w-8 h-8 rounded-full bg-white border border-slate-200 text-slate-400 hover:text-indigo-600 hover:border-indigo-200 flex items-center justify-center transition-all shadow-sm" title="Kopyala"><i class="fa-regular fa-copy"></i></button>${reportButtonHtml}</div>
                </div>
            </div>
        </div>
        `;
    }).join('');
}

// ==========================================
// İLAN SİLME & KOPYALAMA
// ==========================================
let campaignToDeleteId = null;
window.deleteCampaign = function (campaignId) { campaignToDeleteId = campaignId; toggleModal('deleteConfirmModal'); };

document.addEventListener('DOMContentLoaded', () => {
    const confirmDeleteBtn = document.getElementById('confirmDeleteBtn');
    if (confirmDeleteBtn) {
        confirmDeleteBtn.addEventListener('click', async () => {
            if (!campaignToDeleteId) return;
            const originalText = confirmDeleteBtn.innerHTML;
            confirmDeleteBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> İşleniyor...'; confirmDeleteBtn.disabled = true;

            const token = localStorage.getItem('takasToken') || sessionStorage.getItem('takasToken');
            try {
                const response = await fetch(`/api/campaigns/${campaignToDeleteId}`, { method: 'DELETE', headers: { 'Authorization': `Bearer ${token}` } });
                const data = await response.json();
                if (response.ok) {
                    showToast(data.message, 'success');
                    let user = JSON.parse(localStorage.getItem('takasUser') || sessionStorage.getItem('takasUser'));
                    user.balance = data.newBalance;
                    if (localStorage.getItem('takasUser')) localStorage.setItem('takasUser', JSON.stringify(user));
                    else sessionStorage.setItem('takasUser', JSON.stringify(user));
                    checkAuth(); loadProfileData(); loadCampaigns(1);
                } else { showToast(data.message, 'warning'); }
            } catch (error) { showToast('Bağlantı hatası.', 'error'); }
            finally { toggleModal('deleteConfirmModal'); confirmDeleteBtn.innerHTML = originalText; confirmDeleteBtn.disabled = false; campaignToDeleteId = null; }
        });
    }
});

window.copySecretCode = function (code, btn) {
    navigator.clipboard.writeText(code);
    btn.innerHTML = '<i class="fa-solid fa-check text-emerald-500"></i>';
    btn.classList.add('border-emerald-200', 'bg-emerald-50');
    showToast('Kod panoya kopyalandı!', 'success');
    setTimeout(() => { btn.innerHTML = '<i class="fa-regular fa-copy"></i>'; btn.classList.remove('border-emerald-200', 'bg-emerald-50'); }, 2000);
};

// ==========================================
// ANA EVENT DİNLEYİCİLERİ (OMNI-AUTH & ARAMA)
// ==========================================
document.addEventListener('DOMContentLoaded', () => {
    checkAuth(); loadCampaigns();

    const searchInput = document.getElementById('searchInput');
    let searchTimeout;
    if (searchInput) {
        searchInput.addEventListener('input', (e) => {
            clearTimeout(searchTimeout); searchQuery = e.target.value;
            searchTimeout = setTimeout(() => loadCampaigns(1), 500);
        });
    }

    const filterBtns = document.querySelectorAll('.filter-btn');
    filterBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            filterBtns.forEach(b => { b.classList.remove('bg-indigo-600', 'text-white'); b.classList.add('bg-white', 'text-slate-600'); });
            btn.classList.remove('bg-white', 'text-slate-600'); btn.classList.add('bg-indigo-600', 'text-white');
            currentCategory = btn.getAttribute('data-filter') || 'Tümü'; loadCampaigns(1);
        });
    });

    const registerPassword = document.getElementById('registerPassword');
    const passRules = document.getElementById('passRules');
    if (registerPassword && passRules) {
        registerPassword.addEventListener('input', (e) => {
            const val = e.target.value; let msgs = [];
            if (val.length < 8) msgs.push('En az 8 karakter');
            if (!/[A-Z]/.test(val)) msgs.push('1 Büyük harf');
            if (!/[0-9]/.test(val)) msgs.push('1 Rakam');
            if (val.length === 0) passRules.innerHTML = '';
            else if (msgs.length === 0) passRules.innerHTML = '<span class="text-emerald-500"><i class="fa-solid fa-shield-check"></i> Şifre güçlü ve güvenli!</span>';
            else passRules.innerHTML = `<span class="text-rose-500"><i class="fa-solid fa-triangle-exclamation"></i> Eksik: ${msgs.join(', ')}</span>`;
        });
    }

    const loginForm = document.getElementById('loginForm');
    if (loginForm) loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const identifier = document.getElementById('loginIdentifier').value.trim();
        const password = document.getElementById('loginPassword').value;
        const btn = e.target.querySelector('button[type="submit"]');
        const origText = btn.innerHTML;
        if (!identifier) return showToast('Lütfen E-posta veya Telefon numaranızı girin.', 'warning');
        btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Kontrol Ediliyor...'; btn.disabled = true;

        try {
            const response = await fetch('/api/auth/login', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ identifier, password }) });
            const data = await response.json();
            if (response.ok) { saveAuthData(data); showToast('Hoş geldiniz!', 'success'); window.location.reload(); }
            else {
                if (response.status === 404) showToast('Sistemde böyle bir kullanıcı bulunamadı.', 'error');
                else if (response.status === 401) showToast('Şifreniz hatalı. Lütfen tekrar deneyin.', 'error');
                else showToast(data.message || 'Giriş yapılamadı.', 'error');
                if (data.needsVerification) showToast('Lütfen cihazınıza gönderilen kodla hesabınızı doğrulayın.', 'warning');
            }
        } catch (error) { showToast('Sunucu ile iletişim kurulamadı.', 'error'); }
        btn.innerHTML = origText; btn.disabled = false;
    });

    const registerForm = document.getElementById('registerForm');
    if (registerForm) registerForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const identifier = document.getElementById('registerIdentifier').value.trim();
        const password = document.getElementById('registerPassword').value;
        const btn = e.target.querySelector('button[type="submit"]');
        if (password.length < 8 || !/[A-Z]/.test(password) || !/[0-9]/.test(password)) return showToast('Şifreniz güvenlik kurallarına uymuyor.', 'warning');
        const origText = btn.innerHTML; btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Hesap Oluşturuluyor...'; btn.disabled = true;

        try {
            const response = await fetch('/api/auth/register', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name: document.getElementById('registerName').value, identifier, password }) });
            const data = await response.json();
            if (response.ok) {
                showToast('Doğrulama kodu gönderildi!', 'success');
                window.targetIdentifier = identifier; authActionFlow = 'register';
                document.getElementById('displayOtpEmail').innerText = identifier;
                switchAuthView('otp');
            } else {
                if (response.status === 409) showToast('Bu iletişim adresi zaten kullanımda.', 'error');
                else showToast(data.message, 'error');
            }
        } catch (error) { showToast('Sunucu bağlantı hatası.', 'error'); }
        btn.innerHTML = origText; btn.disabled = false;
    });

    const forgotForm = document.getElementById('forgotForm');
    if (forgotForm) forgotForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const identifier = document.getElementById('forgotEmail').value.trim();
        const btn = e.target.querySelector('button[type="submit"]');
        const origText = btn.innerHTML; btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> İşleniyor...'; btn.disabled = true;

        try {
            const response = await fetch('/api/auth/forgot-password', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email: identifier }) });
            const data = await response.json();
            if (response.ok) {
                showToast('Sıfırlama kodu gönderildi!', 'success');
                window.targetIdentifier = identifier; authActionFlow = 'reset';
                document.getElementById('displayOtpEmail').innerText = identifier;
                switchAuthView('otp');
            } else { showToast(data.message, 'error'); }
        } catch (error) { showToast('Sunucu hatası.', 'error'); }
        btn.innerHTML = origText; btn.disabled = false;
    });

    const otpForm = document.getElementById('otpForm');
    if (otpForm) otpForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const code = document.getElementById('otpInput').value;
        const btn = e.target.querySelector('button[type="submit"]');
        const origText = btn.innerHTML; btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Onaylanıyor...'; btn.disabled = true;

        try {
            if (authActionFlow === 'register') {
                const response = await fetch('/api/auth/verify', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ identifier: window.targetIdentifier, code }) });
                const data = await response.json();
                if (response.ok) { saveAuthData(data); showToast('Hesabınız güvenle onaylandı!', 'success'); window.location.reload(); }
                else { showToast('Doğrulama kodu hatalı veya süresi geçmiş.', 'error'); }
            } else if (authActionFlow === 'reset') { window.validatedCode = code; switchAuthView('reset'); }
        } catch (error) { showToast('Sunucu hatası.', 'error'); }
        btn.innerHTML = origText; btn.disabled = false;
    });

    const resetForm = document.getElementById('resetForm');
    if (resetForm) resetForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const newPassword = document.getElementById('resetPassword').value;
        const btn = e.target.querySelector('button[type="submit"]');
        const origText = btn.innerHTML; btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Kaydediliyor...'; btn.disabled = true;

        try {
            const response = await fetch('/api/auth/reset-password', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email: window.targetIdentifier, code: window.validatedCode, newPassword }) });
            const data = await response.json();
            if (response.ok) {
                showToast('Şifreniz güncellendi. Giriş yapabilirsiniz.', 'success');
                document.getElementById('loginIdentifier').value = window.targetIdentifier;
                switchAuthView('login');
            } else { showToast(data.message, 'error'); }
        } catch (error) { showToast('Sunucu hatası.', 'error'); }
        btn.innerHTML = origText; btn.disabled = false;
    });

    // ==========================================
    // AI GÖRSEL TARAMA (5MB KORUMALI)
    // ==========================================
    const aiFileInput = document.getElementById('aiFileInput');
    const selectImageBtn = document.getElementById('selectImageBtn');
    const aiDropZone = document.getElementById('aiDropZone');
    const aiEmptyState = document.getElementById('aiEmptyState');
    const aiImagePreview = document.getElementById('aiImagePreview');
    const aiScanningOverlay = document.getElementById('aiScanningOverlay');
    const addCampaignForm = document.getElementById('addCampaignForm');
    const submitCampaignBtn = document.getElementById('submitCampaignBtn');

    if (selectImageBtn && aiFileInput) {
        selectImageBtn.addEventListener('click', (e) => { e.preventDefault(); aiFileInput.click(); });
        if (aiDropZone) aiDropZone.addEventListener('click', () => aiFileInput.click());
    }

    if (aiFileInput) { aiFileInput.addEventListener('change', handleFileSelect); }

    async function handleFileSelect(e) {
        const file = e.target.files[0] || e.dataTransfer?.files[0];
        if (!file || !file.type.startsWith('image/')) { showToast('Lütfen geçerli bir görsel yükleyin.', 'error'); return; }

        // 🔥 YENİ: 5MB GÜVENLİK DUVARI 🔥
        if (file.size > 5 * 1024 * 1024) {
            showToast('Dosya boyutu çok büyük! Maksimum 5MB yükleyebilirsiniz.', 'error');
            if (aiFileInput) aiFileInput.value = '';
            return;
        }

        const reader = new FileReader();
        reader.onload = (event) => {
            if (aiImagePreview) { aiImagePreview.src = event.target.result; aiImagePreview.classList.remove('hidden'); }
            if (aiEmptyState) aiEmptyState.classList.add('hidden');
        };
        reader.readAsDataURL(file);

        if (aiScanningOverlay) aiScanningOverlay.classList.remove('hidden');
        if (submitCampaignBtn) submitCampaignBtn.disabled = true;

        const formData = new FormData(); formData.append('image', file);

        try {
            const response = await fetch('/api/ai/scan', { method: 'POST', headers: { 'Authorization': `Bearer ${localStorage.getItem('takasToken') || sessionStorage.getItem('takasToken')}` }, body: formData });
            const result = await response.json();

            if (response.ok && result.success) {
                if (result.data.brand && addCampaignForm.brand) addCampaignForm.brand.value = result.data.brand;
                if (result.data.title && addCampaignForm.title) addCampaignForm.title.value = result.data.title;
                if (result.data.code && addCampaignForm.code) addCampaignForm.code.value = result.data.code;
                if (result.data.category && addCampaignForm.category) addCampaignForm.category.value = result.data.category;
                if (result.data.expiryDate && addCampaignForm.expiryDate) {
                    const date = new Date(result.data.expiryDate); addCampaignForm.expiryDate.value = date.toISOString().split('T')[0];
                }
                showToast('AI detayları başarıyla analiz etti. Lütfen kontrol edin.', 'success');
            } else { throw new Error(result.message || 'AI Taraması başarısız.'); }
        } catch (error) {
            showToast('AI taraması sırasında hata oluştu. Detayları manuel girebilirsiniz.', 'warning');
        } finally {
            if (aiScanningOverlay) aiScanningOverlay.classList.add('hidden');
            if (submitCampaignBtn) submitCampaignBtn.disabled = false;
        }
    }

    if (addCampaignForm) {
        addCampaignForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            if (submitCampaignBtn) { submitCampaignBtn.disabled = true; submitCampaignBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin mr-2"></i> Yayınlanıyor...'; }

            const formData = new FormData(addCampaignForm);
            if (aiFileInput && aiFileInput.files[0]) { formData.append('image', aiFileInput.files[0]); }
            else { showToast('Lütfen kampanya görseli seçin.', 'error'); if (submitCampaignBtn) { submitCampaignBtn.disabled = false; submitCampaignBtn.innerHTML = '<i class="fa-solid fa-rocket mr-2"></i> Yayınla ve Kredi Kazan'; } return; }

            try {
                const response = await fetch('/api/campaigns', { method: 'POST', headers: { 'Authorization': `Bearer ${localStorage.getItem('takasToken') || sessionStorage.getItem('takasToken')}` }, body: formData });
                const result = await response.json();

                if (response.ok) {
                    showToast('İlanınız başarıyla yayınlandı! 🎉', 'success');
                    let user = JSON.parse(localStorage.getItem('takasUser') || sessionStorage.getItem('takasUser'));
                    if (user && result.newBalance !== undefined) {
                        user.balance = result.newBalance;
                        if (localStorage.getItem('takasUser')) localStorage.setItem('takasUser', JSON.stringify(user));
                        else sessionStorage.setItem('takasUser', JSON.stringify(user));
                        checkAuth();
                    }
                    toggleModal('addCampaignModal'); addCampaignForm.reset();
                    if (aiImagePreview) { aiImagePreview.src = ""; aiImagePreview.classList.add('hidden'); }
                    if (aiEmptyState) aiEmptyState.classList.remove('hidden');
                    loadCampaigns();
                } else { throw new Error(result.message || 'İlan yayınlanamadı.'); }
            } catch (error) { showToast(error.message, 'error'); }
            finally { if (submitCampaignBtn) { submitCampaignBtn.disabled = false; submitCampaignBtn.innerHTML = '<i class="fa-solid fa-rocket mr-2"></i> Yayınla ve Kredi Kazan'; } }
        });
    }

    if (aiDropZone) {
        ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => { aiDropZone.addEventListener(eventName, (e) => { e.preventDefault(); e.stopPropagation(); }, false); });
        ['dragenter', 'dragover'].forEach(eventName => { aiDropZone.addEventListener(eventName, () => aiDropZone.classList.add('border-indigo-400', 'bg-indigo-50/50'), false); });
        ['dragleave', 'drop'].forEach(eventName => { aiDropZone.addEventListener(eventName, () => aiDropZone.classList.remove('border-indigo-400', 'bg-indigo-50/50'), false); });
        aiDropZone.addEventListener('drop', handleFileSelect, false);
    }
});

// ==========================================
// AYARLAR, ŞİKAYET VE CÜZDAN MOTORLARI
// ==========================================
window.switchSettingsTab = function (tabName) {
    ['Profile', 'Security', 'Notif'].forEach(tab => {
        document.getElementById(`settings${tab}Content`).classList.add('hidden');
        document.getElementById(`tabSettings${tab}`).className = "w-full text-left px-4 py-3 text-slate-500 hover:bg-slate-100 hover:text-slate-700 rounded-xl font-medium text-sm transition";
    });
    document.getElementById(`settings${tabName.charAt(0).toUpperCase() + tabName.slice(1)}Content`).classList.remove('hidden');
    document.getElementById(`tabSettings${tabName.charAt(0).toUpperCase() + tabName.slice(1)}`).className = "w-full text-left px-4 py-3 bg-indigo-50 text-indigo-600 rounded-xl font-bold text-sm shadow-sm border border-indigo-100/50 transition";
};

window.openSettingsModal = function () {
    toggleModal('settingsModal'); switchSettingsTab('profile');
    const userStr = localStorage.getItem('takasUser') || sessionStorage.getItem('takasUser');
    if (userStr) {
        const user = JSON.parse(userStr);
        document.getElementById('settingsName').value = user.name || '';
        document.getElementById('settingsEmail').value = user.email || '';
        const phoneEl = document.getElementById('settingsPhone'); if (phoneEl) phoneEl.value = user.phone || '';
        if (user.notifications) { document.getElementById('notifTradeAlerts').checked = user.notifications.tradeAlerts; document.getElementById('notifSystemEmails').checked = user.notifications.systemEmails; }
        else { document.getElementById('notifTradeAlerts').checked = true; document.getElementById('notifSystemEmails').checked = true; }
        const avatarPreview = document.getElementById('settingsAvatarPreview');
        if (avatarPreview) avatarPreview.src = user.avatar ? `/${user.avatar}` : `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name)}&background=4f46e5&color=fff&size=128`;
    }
};

window.closeSettingsModal = function () { toggleModal('settingsModal'); };

document.addEventListener('DOMContentLoaded', () => {
    const avatarInput = document.getElementById('settingsAvatarInput');
    if (avatarInput) {
        avatarInput.addEventListener('change', function () {
            const file = this.files[0];
            if (file) { const reader = new FileReader(); reader.onload = function (e) { document.getElementById('settingsAvatarPreview').src = e.target.result; }; reader.readAsDataURL(file); }
        });
    }

    const token = localStorage.getItem('takasToken') || sessionStorage.getItem('takasToken');

    const settingsProfileForm = document.getElementById('settingsProfileForm');
    if (settingsProfileForm) {
        settingsProfileForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const btn = e.target.querySelector('button'); const origText = btn.innerHTML; btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Kaydediliyor...'; btn.disabled = true;

            const formData = new FormData();
            formData.append('name', document.getElementById('settingsName').value);
            const phoneInput = document.getElementById('settingsPhone'); if (phoneInput && phoneInput.value) { formData.append('phone', phoneInput.value.trim()); }
            if (avatarInput && avatarInput.files[0]) { formData.append('avatar', avatarInput.files[0]); }

            try {
                const response = await fetch('/api/auth/update', { method: 'PUT', headers: { 'Authorization': `Bearer ${token}` }, body: formData });
                const data = await response.json();
                if (response.ok) { showToast(data.message, 'success'); saveUserLocally(data); } else showToast(data.message, 'error');
            } catch (err) { showToast('Sunucu hatası.', 'error'); } finally { btn.innerHTML = origText; btn.disabled = false; }
        });
    }

    const settingsSecurityForm = document.getElementById('settingsSecurityForm');
    if (settingsSecurityForm) {
        settingsSecurityForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const currentPass = document.getElementById('secCurrentPassword').value; const newPass = document.getElementById('secNewPassword').value; const confirmPass = document.getElementById('secNewPasswordConfirm').value;
            if (newPass !== confirmPass) return showToast('Yeni şifreler eşleşmiyor!', 'error');

            const btn = e.target.querySelector('button'); const origText = btn.innerHTML; btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Doğrulanıyor...'; btn.disabled = true;
            try {
                const response = await fetch('/api/auth/update-password', { method: 'PUT', headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' }, body: JSON.stringify({ currentPassword: currentPass, newPassword: newPass }) });
                const data = await response.json();
                if (response.ok) { showToast(data.message, 'success'); settingsSecurityForm.reset(); } else showToast(data.message, 'error');
            } catch (err) { showToast('Sunucu hatası.', 'error'); } finally { btn.innerHTML = origText; btn.disabled = false; }
        });
    }

    const settingsNotifForm = document.getElementById('settingsNotifForm');
    if (settingsNotifForm) {
        settingsNotifForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const btn = e.target.querySelector('button'); const origText = btn.innerHTML; btn.innerHTML = 'Kaydediliyor...'; btn.disabled = true;

            const formData = new FormData();
            formData.append('tradeAlerts', document.getElementById('notifTradeAlerts').checked); formData.append('systemEmails', document.getElementById('notifSystemEmails').checked);
            try {
                const response = await fetch('/api/auth/update', { method: 'PUT', headers: { 'Authorization': `Bearer ${token}` }, body: formData });
                const data = await response.json();
                if (response.ok) { showToast('Bildirim tercihleriniz güncellendi.', 'success'); saveUserLocally(data); }
            } catch (err) { showToast('Sunucu hatası.', 'error'); } finally { btn.innerHTML = origText; btn.disabled = false; }
        });
    }

    function saveUserLocally(data) {
        if (localStorage.getItem('takasUser')) { localStorage.setItem('takasUser', JSON.stringify(data)); localStorage.setItem('takasToken', data.token); }
        else { sessionStorage.setItem('takasUser', JSON.stringify(data)); sessionStorage.setItem('takasToken', data.token); }
        checkAuth();
        const mainAvatar = document.getElementById('userProfileImage');
        if (mainAvatar) mainAvatar.src = data.avatar ? `/${data.avatar}` : mainAvatar.src;
    }
});

window.openReportModal = function () { toggleModal('tradeResultModal'); toggleModal('reportModal'); };
window.openReportModalFromProfile = function (campaignId) { window.lastBoughtCampaignId = campaignId; toggleModal('profileModal'); toggleModal('reportModal'); };

document.addEventListener('DOMContentLoaded', () => {
    const reportForm = document.getElementById('reportForm');
    if (reportForm) {
        reportForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            if (!window.lastBoughtCampaignId) return showToast('Şikayet edilecek ilan bulunamadı!', 'error');
            const submitBtn = e.target.querySelector('button[type="submit"]'); const originalText = submitBtn.innerHTML;
            submitBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Kanıtlar Yükleniyor...'; submitBtn.disabled = true;

            const formData = new FormData();
            const reasonSelect = document.getElementById('reportReasonSelect').value; const reasonText = document.getElementById('reportReasonText').value; const proofImage = document.getElementById('reportProof').files[0];
            const finalReason = reasonText ? `${reasonSelect} - ${reasonText}` : reasonSelect;
            formData.append('reason', finalReason); formData.append('proofImage', proofImage);

            try {
                const response = await fetch(`/api/campaigns/${window.lastBoughtCampaignId}/report`, { method: 'POST', headers: { 'Authorization': `Bearer ${localStorage.getItem('takasToken') || sessionStorage.getItem('takasToken')}` }, body: formData });
                const data = await response.json();
                if (response.ok) { showToast('Şikayetiniz kanıtlarla birlikte yönetime iletildi. İnceleniyor 🔍', 'success'); toggleModal('reportModal'); reportForm.reset(); }
                else { showToast(data.message, 'error'); }
            } catch (error) { showToast('Sunucu bağlantı hatası.', 'error'); } finally { submitBtn.innerHTML = originalText; submitBtn.disabled = false; }
        });
    }
});

window.openTransactionHistory = async function () {
    toggleModal('transactionHistoryModal');
    const userStr = localStorage.getItem('takasUser') || sessionStorage.getItem('takasUser');
    if (userStr) document.getElementById('historyCurrentBalance').innerText = JSON.parse(userStr).balance + " Kredi";

    const container = document.getElementById('transactionList');
    const transactionSkeleton = `<div class="bg-white border border-slate-100 p-4 rounded-2xl shadow-sm flex items-center gap-4 overflow-hidden"><div class="animate-pulse w-12 h-12 bg-slate-200 rounded-xl shrink-0"></div><div class="animate-pulse flex-1"><div class="h-4 bg-slate-200 rounded w-2/3 mb-2"></div><div class="h-2 bg-slate-200 rounded w-1/3"></div></div><div class="animate-pulse w-8 h-6 bg-slate-200 rounded shrink-0"></div></div>`;
    container.innerHTML = Array(5).fill(transactionSkeleton).join('');
    try {
        const response = await fetch('/api/auth/transactions', { headers: { 'Authorization': `Bearer ${localStorage.getItem('takasToken') || sessionStorage.getItem('takasToken')}` } });
        if (response.ok) { const transactions = await response.json(); renderTransactions(transactions); }
        else { container.innerHTML = '<div class="text-center text-red-500 py-10"><i class="fa-solid fa-circle-exclamation text-2xl mb-3"></i><p class="text-sm">Geçmiş yüklenemedi.</p></div>'; }
    } catch (error) { container.innerHTML = '<div class="text-center text-red-500 py-10"><i class="fa-solid fa-wifi text-2xl mb-3"></i><p class="text-sm">Bağlantı hatası.</p></div>'; }
};

function renderTransactions(transactions) {
    const container = document.getElementById('transactionList');
    if (transactions.length === 0) { container.innerHTML = `<div class="text-center py-12"><div class="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center text-slate-300 text-2xl mx-auto mb-3"><i class="fa-solid fa-receipt"></i></div><h4 class="text-slate-600 font-bold mb-1">Henüz İşlem Yok</h4><p class="text-xs text-slate-400">Kredi kazandıkça veya harcadıkça burada görünecek.</p></div>`; return; }

    const sourceIcons = { 'ilan_ekleme': '<i class="fa-solid fa-cloud-arrow-up"></i>', 'takas': '<i class="fa-solid fa-handshake"></i>', 'sikayet_odulu': '<i class="fa-solid fa-gavel"></i>', 'ilan_silme': '<i class="fa-solid fa-trash-can"></i>', 'video_izleme': '<i class="fa-solid fa-play"></i>', 'sistem_hediyesi': '<i class="fa-solid fa-gift"></i>' };

    container.innerHTML = transactions.map(t => {
        const isEarned = t.type === 'kazanc';
        const colorClass = isEarned ? 'text-emerald-500 bg-emerald-50 border-emerald-100' : 'text-rose-500 bg-rose-50 border-rose-100';
        const dateObj = new Date(t.createdAt);
        return `
            <div class="bg-white border border-slate-100 p-4 rounded-2xl shadow-sm flex items-center gap-4 hover:shadow-md transition-shadow">
                <div class="w-12 h-12 rounded-xl flex items-center justify-center text-lg shrink-0 border ${colorClass}">${sourceIcons[t.source] || '<i class="fa-solid fa-circle-info"></i>'}</div>
                <div class="flex-1 min-w-0">
                    <p class="text-sm font-bold text-slate-800 truncate">${t.description}</p>
                    <p class="text-[11px] font-medium text-slate-400 mt-0.5"><i class="fa-regular fa-calendar-days"></i> ${dateObj.toLocaleDateString('tr-TR', { day: 'numeric', month: 'short' })} • <i class="fa-regular fa-clock"></i> ${dateObj.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })}</p>
                </div>
                <div class="text-right shrink-0"><span class="text-base font-extrabold ${isEarned ? 'text-emerald-500' : 'text-rose-500'}">${isEarned ? '+' : '-'}${t.amount}</span><p class="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Kredi</p></div>
            </div>`;
    }).join('');
}

window.toggleFAQ = function (btn) {
    const content = btn.nextElementSibling; const icon = btn.querySelector('i');
    if (content.style.maxHeight) { content.style.maxHeight = null; icon.style.transform = "rotate(0deg)"; btn.classList.remove('text-indigo-600'); }
    else {
        document.querySelectorAll('#supportModal .max-h-0').forEach(el => { el.style.maxHeight = null; el.previousElementSibling.querySelector('i').style.transform = "rotate(0deg)"; el.previousElementSibling.classList.remove('text-indigo-600'); });
        content.style.maxHeight = content.scrollHeight + "px"; icon.style.transform = "rotate(180deg)"; btn.classList.add('text-indigo-600');
    }
};

window.openSupportModal = function () {
    toggleModal('supportModal');
    const userStr = localStorage.getItem('takasUser') || sessionStorage.getItem('takasUser');
    if (userStr) { const user = JSON.parse(userStr); document.getElementById('supportName').value = user.name || ''; document.getElementById('supportEmail').value = user.email || ''; }
};

document.addEventListener('DOMContentLoaded', () => {
    const supportForm = document.getElementById('supportForm');
    if (supportForm) {
        supportForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const btn = e.target.querySelector('button[type="submit"]'); const origText = btn.innerHTML; btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Gönderiliyor...'; btn.disabled = true;
            const payload = { name: document.getElementById('supportName').value, email: document.getElementById('supportEmail').value, subject: document.getElementById('supportSubject').value, message: document.getElementById('supportMessage').value };
            try {
                const response = await fetch('/api/auth/support', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
                const data = await response.json();
                if (response.ok) { showToast(data.message, 'success'); supportForm.reset(); toggleModal('supportModal'); } else showToast(data.message, 'error');
            } catch (error) { showToast('Sunucu bağlantı hatası.', 'error'); } finally { btn.innerHTML = origText; btn.disabled = false; }
        });
    }
});

// ==========================================
// BİLDİRİM VE MOBİL MOTORLARI
// ==========================================
window.openNotificationSidebar = function () {
    const wrapper = document.getElementById('notificationSidebarWrapper'); const sidebar = document.getElementById('notificationSidebar');
    wrapper.classList.remove('hidden'); setTimeout(() => { wrapper.classList.remove('opacity-0'); sidebar.classList.remove('translate-x-full'); }, 10);
    loadNotifications(true);
};
window.closeNotificationSidebar = function () {
    const wrapper = document.getElementById('notificationSidebarWrapper'); const sidebar = document.getElementById('notificationSidebar');
    wrapper.classList.add('opacity-0'); sidebar.classList.add('translate-x-full'); setTimeout(() => { wrapper.classList.add('hidden'); }, 300);
};

window.loadNotifications = async function (markAsRead = false) {
    const token = localStorage.getItem('takasToken') || sessionStorage.getItem('takasToken'); if (!token) return;
    const notifContainer = document.getElementById('notificationList');
    if (notifContainer && !markAsRead) {
        notifContainer.innerHTML = Array(6).fill(`<div class="bg-white border border-slate-100 p-4 rounded-2xl flex items-start gap-3 overflow-hidden"><div class="animate-pulse w-6 h-6 bg-slate-200 rounded-full shrink-0"></div><div class="animate-pulse flex-1"><div class="h-3 bg-slate-200 rounded w-1/2 mb-2"></div><div class="h-2 bg-slate-200 rounded w-full mb-1"></div><div class="h-2 bg-slate-200 rounded w-3/4 mb-2"></div></div></div>`).join('');
    }
    try {
        const response = await fetch('/api/auth/notifications', { headers: { 'Authorization': `Bearer ${token}` } });
        if (response.ok) {
            const notifications = await response.json(); renderNotifications(notifications);
            const unreadCount = notifications.filter(n => !n.isRead).length;
            updateBadgeVisibility(unreadCount);
            const unreadText = document.getElementById('unreadCountText'); if (unreadText) unreadText.innerText = `${unreadCount} Okunmamış`;
            if (markAsRead && unreadCount > 0) markAllNotificationsRead();
        }
    } catch (error) { console.error("Bildirimler yüklenemedi:", error); }
};

window.markAllNotificationsRead = async function () {
    const token = localStorage.getItem('takasToken') || sessionStorage.getItem('takasToken'); if (!token) return;
    try { await fetch('/api/auth/notifications/read', { method: 'PUT', headers: { 'Authorization': `Bearer ${token}` } }); loadNotifications(false); } catch (error) { console.error("Okundu hatası"); }
};

function renderNotifications(notifications) {
    const container = document.getElementById('notificationList'); if (!container) return;
    if (notifications.length === 0) { container.innerHTML = `<div class="text-center py-16"><div class="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center text-slate-300 text-2xl mx-auto mb-4 border border-slate-200"><i class="fa-regular fa-bell-slash"></i></div><h4 class="text-slate-600 font-bold mb-1">Bildirim Yok</h4><p class="text-xs text-slate-400">Şu an için her şey sakin.</p></div>`; return; }
    const icons = { 'success': '<i class="fa-solid fa-check-circle text-emerald-500"></i>', 'info': '<i class="fa-solid fa-circle-info text-indigo-500"></i>', 'warning': '<i class="fa-solid fa-triangle-exclamation text-amber-500"></i>', 'error': '<i class="fa-solid fa-times-circle text-red-500"></i>' };
    container.innerHTML = notifications.map(n => {
        const bgClass = n.isRead ? 'bg-white border-slate-100' : 'bg-indigo-50/50 border-indigo-100 shadow-sm';
        const dateStr = new Date(n.createdAt).toLocaleDateString('tr-TR', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
        return `<div class="${bgClass} border p-4 rounded-2xl flex items-start gap-3 transition-colors"><div class="text-2xl pt-0.5 shrink-0">${icons[n.type] || icons['info']}</div><div><h4 class="text-sm font-bold text-slate-800 mb-0.5">${n.title}</h4><p class="text-xs text-slate-500 font-medium leading-relaxed mb-1.5">${n.message}</p><p class="text-[10px] text-slate-400 font-bold uppercase tracking-wider">${dateStr}</p></div>${!n.isRead ? '<div class="w-2 h-2 bg-indigo-500 rounded-full mt-2 shrink-0"></div>' : ''}</div>`;
    }).join('');
}

window.openMobileAuthCheck = function (modalOrActionId) {
    const token = localStorage.getItem('takasToken') || sessionStorage.getItem('takasToken');
    if (!token) { showToast('Bu işlemi yapmak için giriş yapmalısınız.', 'warning'); toggleModal('authModal'); switchAuthView('login'); return; }
    if (modalOrActionId === 'notificationSidebarWrapper') openNotificationSidebar();
    else if (modalOrActionId === 'transactionHistoryModal') openTransactionHistory();
    else if (modalOrActionId === 'profileModal') { toggleModal('profileModal'); loadProfileData(); }
    else if (modalOrActionId === 'addCampaignModal') toggleModal('addCampaignModal');
};

window.updateBadgeVisibility = function (unreadCount) {
    const desktopBadge = document.getElementById('notifBadge'); const mobileBadge = document.getElementById('mobileNotifBadge');
    if (unreadCount > 0) { if (desktopBadge) desktopBadge.classList.remove('hidden'); if (mobileBadge) mobileBadge.classList.remove('hidden'); }
    else { if (desktopBadge) desktopBadge.classList.add('hidden'); if (mobileBadge) mobileBadge.classList.add('hidden'); }
};

window.addEventListener('scroll', () => {
    if (window.innerHeight + window.scrollY >= document.body.offsetHeight - 150) {
        if (!isFetching && currentPage < totalPages) loadCampaigns(currentPage + 1, true);
    }
});