// Toast Bildirim Sistemi
function showToast(message, type = 'success') {
    const container = document.getElementById('toastContainer');
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    const icon = type === 'success' ? '<i class="fa-solid fa-check-circle text-xl"></i>' : '<i class="fa-solid fa-circle-exclamation text-xl"></i>';
    toast.innerHTML = `${icon} <span>${message}</span>`;
    container.appendChild(toast);
    setTimeout(() => { toast.classList.add('fade-out'); setTimeout(() => toast.remove(), 300); }, 3000);
}

// Şikayetleri Sunucudan Çek
async function loadReports() {
    const token = localStorage.getItem('takasToken');
    if (!token) return showToast('Admin girişi gerekli!', 'error');

    try {
        const response = await fetch('/api/campaigns/reports/pending', {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const reports = await response.json();
        
        const grid = document.getElementById('reportsGrid');
        grid.innerHTML = '';

        if (reports.length === 0) {
            grid.innerHTML = '<p class="col-span-full text-center text-slate-500 py-10 bg-white rounded-2xl border border-slate-200 shadow-sm">Şu an incelenecek şikayet bulunmuyor. Sistem temiz! ✨</p>';
            return;
        }

        reports.forEach(report => {
            const proofHtml = report.proofImage 
                ? `<div class="mt-4 cursor-pointer" onclick="openImageModal('/${report.proofImage}')"><img src="/${report.proofImage}" class="w-full h-32 object-cover rounded-lg border border-slate-200 hover:opacity-80 transition" alt="Kanıt"></div>` 
                : `<div class="mt-4 bg-slate-100 text-slate-400 text-center py-4 rounded-lg text-sm border border-slate-200">Kanıt Görseli Yüklenmedi</div>`;

            const card = document.createElement('div');
            card.className = 'bg-white rounded-2xl p-6 shadow-sm border border-slate-200 flex flex-col justify-between';
            card.innerHTML = `
                <div>
                    <div class="flex justify-between items-start mb-4">
                        <span class="bg-red-100 text-red-600 px-3 py-1 rounded-full text-xs font-bold"><i class="fa-solid fa-triangle-exclamation"></i> Şikayet</span>
                        <span class="text-xs text-slate-400">${new Date(report.createdAt).toLocaleDateString()}</span>
                    </div>
                    
                    <h3 class="font-bold text-slate-800 text-lg mb-1">${report.campaign?.brand || 'Bilinmeyen Marka'}</h3>
                    <p class="font-mono text-indigo-600 bg-indigo-50 px-2 py-1 rounded text-sm mb-4 inline-block">${report.campaign?.code || 'Kod Silinmiş'}</p>
                    
                    <div class="bg-slate-50 p-3 rounded-lg border border-slate-100 mb-4">
                        <p class="text-sm text-slate-600"><strong>Şikayet Eden:</strong> ${report.reporter?.email}</p>
                        <p class="text-sm text-slate-600 mt-1"><strong>Satıcı:</strong> ${report.reportedUser?.email}</p>
                        <p class="text-xs text-red-500 font-bold mt-1">Satıcı Güven Puanı: ${report.reportedUser?.trustScore} ${report.reportedUser?.isBanned ? '(BANLI)' : ''}</p>
                    </div>

                    <p class="text-slate-700 text-sm italic border-l-4 border-red-400 pl-3">"${report.reason}"</p>
                    
                    ${proofHtml}
                </div>

                <div class="flex gap-2 mt-6 pt-4 border-t border-slate-100">
                    <button onclick="resolveReport('${report._id}', 'approve')" class="flex-1 bg-red-500 hover:bg-red-600 text-white py-2 rounded-xl text-sm font-bold shadow-sm transition">
                        <i class="fa-solid fa-gavel"></i> Haklı (-20 Puan)
                    </button>
                    <button onclick="resolveReport('${report._id}', 'reject')" class="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-600 py-2 rounded-xl text-sm font-bold shadow-sm transition">
                        <i class="fa-solid fa-ban"></i> Haksız (Reddet)
                    </button>
                </div>
            `;
            grid.appendChild(card);
        });
    } catch (error) {
        showToast('Veriler çekilemedi.', 'error');
    }
}

// ==========================================
// ADMİN KARAR MOTORU VE ÖZEL MODALI
// ==========================================
let pendingReportId = null;
let pendingAction = null;

function closeAdminConfirm() {
    const modal = document.getElementById('adminConfirmModal');
    modal.classList.add('opacity-0');
    setTimeout(() => modal.classList.add('hidden'), 300);
    pendingReportId = null;
    pendingAction = null;
}

// 1. "Haklı" veya "Haksız" butonuna basınca sadece özel modalı açar ve tasarımı ayarlar
function resolveReport(reportId, action) {
    pendingReportId = reportId;
    pendingAction = action;

    const modal = document.getElementById('adminConfirmModal');
    const iconBox = document.getElementById('adminConfirmIcon');
    const title = document.getElementById('adminConfirmTitle');
    const desc = document.getElementById('adminConfirmDesc');
    const confirmBtn = document.getElementById('adminConfirmBtn');

    modal.classList.remove('hidden');
    setTimeout(() => modal.classList.remove('opacity-0'), 10);

    if (action === 'approve') {
        iconBox.className = "w-20 h-20 bg-red-50 rounded-full flex items-center justify-center text-4xl mx-auto mb-5 border-[6px] border-white shadow-sm text-red-500";
        iconBox.innerHTML = '<i class="fa-solid fa-gavel"></i>';
        title.innerText = "Satıcıyı Cezalandır";
        desc.innerHTML = "Satıcıdan 20 puan düşülecek ve şikayetçiye 1 kredi verilecek. Onaylıyor musunuz?";
        confirmBtn.className = "flex-1 bg-red-500 text-white font-bold py-3.5 rounded-xl hover:bg-red-600 transition-all shadow-lg shadow-red-200 active:scale-95";
        confirmBtn.innerText = "Evet, Haklı";
    } else {
        iconBox.className = "w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center text-4xl mx-auto mb-5 border-[6px] border-white shadow-sm text-slate-500";
        iconBox.innerHTML = '<i class="fa-solid fa-ban"></i>';
        title.innerText = "Şikayeti Reddet";
        desc.innerHTML = "Bu şikayet reddedilecek ve ilan üzerindeki leke kalkacak. Onaylıyor musunuz?";
        confirmBtn.className = "flex-1 bg-slate-800 text-white font-bold py-3.5 rounded-xl hover:bg-slate-900 transition-all shadow-lg shadow-slate-200 active:scale-95";
        confirmBtn.innerText = "Evet, Haksız";
    }
}

// 2. Modaldaki asıl Onayla butonuna basınca backend'e isteği gönderir
document.addEventListener('DOMContentLoaded', () => {
    const adminConfirmBtn = document.getElementById('adminConfirmBtn');
    if (adminConfirmBtn) {
        adminConfirmBtn.addEventListener('click', async () => {
            if (!pendingReportId || !pendingAction) return;

            const btn = document.getElementById('adminConfirmBtn');
            const originalText = btn.innerText;
            btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i>';
            btn.disabled = true;

            const token = localStorage.getItem('takasToken');
            try {
                const response = await fetch('/api/campaigns/resolve-report', {
                    method: 'POST',
                    headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
                    body: JSON.stringify({ reportId: pendingReportId, action: pendingAction })
                });
                const data = await response.json();

                if (response.ok) {
                    showToast('Karar başarıyla uygulandı!', 'success');
                    loadReports(); 
                } else {
                    showToast(data.message, 'error');
                }
            } catch (error) {
                showToast('Sunucu hatası.', 'error');
            } finally {
                btn.innerHTML = originalText;
                btn.disabled = false;
                closeAdminConfirm();
            }
        });
    }
});
// Resim Büyütme İşlemleri
function openImageModal(src) {
    document.getElementById('fullProofImage').src = src;
    const modal = document.getElementById('imageModal');
    modal.classList.remove('hidden');
    setTimeout(() => modal.classList.remove('opacity-0'), 10);
}

function closeImageModal() {
    const modal = document.getElementById('imageModal');
    modal.classList.add('opacity-0');
    setTimeout(() => modal.classList.add('hidden'), 300);
}

// Sayfa Yüklendiğinde
window.onload = loadReports;