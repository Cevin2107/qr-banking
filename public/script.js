// CevinPay — QR gắn cố định tài khoản Techcombank, tự làm mới theo input.

const ACCOUNTS = {
    TCB: {
        bin: '970407',
        code: 'TCB',
        shortName: 'Techcombank',
        fullName: 'Ngân hàng TMCP Kỹ Thương Việt Nam',
        accountNumber: '19037817132016',
        accountHolder: 'DAO BA ANH QUAN',
        logoUrl: 'https://cdn.vietqr.io/img/TCB.png'
    },
    TPB: {
        bin: '970423',
        code: 'TPB',
        shortName: 'TPBank',
        fullName: 'Ngân hàng TMCP Tiên Phong',
        accountNumber: '10002150181',
        accountHolder: 'DAO BA ANH QUAN',
        logoUrl: 'https://cdn.vietqr.io/img/TPB.png'
    }
};

let currentBankKey = 'TCB';
const DEBOUNCE_MS = 450;

function getActiveAccount() {
    return ACCOUNTS[currentBankKey] || ACCOUNTS.TCB;
}

const amountInput = document.getElementById('amount');
const descriptionInput = document.getElementById('description');
const qrConsole = document.getElementById('qrConsole');
const qrForm = document.getElementById('qrForm');
const qrImg = document.getElementById('qrImage');
const qrFrame = document.querySelector('.qr-frame');
const statusChip = document.getElementById('statusChip');
const statusText = document.getElementById('statusText');
const displayAmount = document.getElementById('displayAmount');
const displayDescription = document.getElementById('displayDescription');
const accountValue = document.getElementById('accountValue');
const downloadBtn = document.getElementById('downloadBtn');
const copyAccountBtn = document.getElementById('copyAccountBtn');
const shareBtn = document.getElementById('shareBtn');
const barClose = document.getElementById('barClose');
const announcementBar = document.getElementById('announcementBar');

let debounceTimer = null;
let requestSeq = 0;
let currentQrSrc = '';

/* ============ Format tiền (dấu chấm ngăn cách, chuẩn vi-VN) ============ */

function formatMoney(value) {
    const digits = String(value).replace(/\D/g, '');
    return digits.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
}

function parseMoney(value) {
    const digits = String(value).replace(/\D/g, '');
    if (!digits) return '';
    const parsed = String(parseInt(digits, 10));
    return parsed === '0' ? '' : parsed;
}

function formatDisplayAmount(amount) {
    return amount ? `${formatMoney(amount)} ₫` : '—';
}

/* ============ Nguồn ảnh QR ============ */

function getProxiedQrUrl(url) {
    if (!url) return '';
    if (url.startsWith('/api/qr-proxy') || url.startsWith('data:')) return url;
    if (url.startsWith('http://') || url.startsWith('https://')) {
        return `/api/qr-proxy?url=${encodeURIComponent(url)}`;
    }
    return url;
}

function buildDirectQrUrl(addInfo) {
    const acc = getActiveAccount();
    const params = new URLSearchParams();
    if (addInfo) params.set('addInfo', addInfo);
    const query = params.toString();
    const directUrl = `https://img.vietqr.io/image/${acc.bin}-${acc.accountNumber}-qr_only.png${query ? `?${query}` : ''}`;
    return getProxiedQrUrl(directUrl);
}

async function fetchQrSrc(amount, description) {
    const acc = getActiveAccount();
    if (!amount) {
        return buildDirectQrUrl(description);
    }

    const params = new URLSearchParams({
        bankCode: acc.bin,
        accountNumber: acc.accountNumber,
        amount,
        description
    });

    const response = await fetch(`/api/generate-qr?${params}`);
    if (!response.ok) {
        throw new Error(`API trả mã lỗi ${response.status}`);
    }
    const data = await response.json();
    if (!data.success || !data.qrCode) {
        throw new Error(data.error || 'Không tạo được mã QR');
    }
    return getProxiedQrUrl(data.qrCode);
}

/* ============ Trạng thái console ============ */

function setStatus(state, text) {
    statusChip.classList.remove('is-ready', 'is-error');
    if (state === 'ready') statusChip.classList.add('is-ready');
    if (state === 'error') statusChip.classList.add('is-error');
    statusText.textContent = text;
}

function updateDetailRows(amount, description) {
    displayAmount.textContent = formatDisplayAmount(amount);
    displayDescription.textContent = description || '—';
}

function applyQr(src) {
    const proxiedSrc = getProxiedQrUrl(src);
    currentQrSrc = proxiedSrc;
    if (qrImg.getAttribute('src') === proxiedSrc) {
        qrFrame.classList.remove('is-refreshing');
        setStatus('ready', 'Chờ thanh toán');
        return;
    }
    qrImg.src = proxiedSrc;
}

qrImg.addEventListener('load', () => {
    qrFrame.classList.remove('is-refreshing');
    setStatus('ready', 'Chờ thanh toán');
});

qrImg.addEventListener('error', () => {
    qrFrame.classList.remove('is-refreshing');
    setStatus('error', 'Lỗi tải mã QR');
});

/* ============ Cập nhật trực tiếp (debounce) ============ */

function scheduleQrRefresh() {
    qrFrame.classList.add('is-refreshing');
    setStatus('busy', 'Đang đồng bộ…');
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(refreshQr, DEBOUNCE_MS);
}

async function refreshQr() {
    const amount = parseMoney(amountInput.value);
    const description = descriptionInput.value.trim();
    const seq = ++requestSeq;

    updateDetailRows(amount, description);

    try {
        const src = await fetchQrSrc(amount, description);
        if (seq !== requestSeq) return;
        applyQr(src);
    } catch (error) {
        if (seq !== requestSeq) return;
        qrFrame.classList.remove('is-refreshing');
        setStatus('error', 'Lỗi tải mã QR');
        console.error('QR refresh failed:', error);
    }
}

/* ============ Input số tiền: format + giữ vị trí con trỏ ============ */

amountInput.addEventListener('input', (e) => {
    const cursorPosition = e.target.selectionStart;
    const oldValue = e.target.value;
    const oldLength = oldValue.length;

    const formatted = formatMoney(oldValue);
    e.target.value = formatted;

    const newLength = formatted.length;
    const newPosition = Math.max(0, cursorPosition + (newLength - oldLength));
    e.target.setSelectionRange(newPosition, newPosition);

    scheduleQrRefresh();
});

descriptionInput.addEventListener('input', () => {
    updateDetailRows(parseMoney(amountInput.value), descriptionInput.value.trim());
    scheduleQrRefresh();
});

qrForm.addEventListener('submit', (e) => {
    e.preventDefault();
    clearTimeout(debounceTimer);
    refreshQr();
    if (qrConsole) {
        qrConsole.scrollIntoView({ behavior: 'smooth', block: 'start' });
    } else {
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }
});

/* ============ Sao chép ============ */

async function copyToClipboard(text) {
    try {
        await navigator.clipboard.writeText(text);
        return true;
    } catch (error) {
        return false;
    }
}

function flashButton(btn, copiedText) {
    const originalText = btn.textContent;
    btn.textContent = copiedText;
    btn.classList.add('is-copied');
    setTimeout(() => {
        btn.textContent = originalText;
        btn.classList.remove('is-copied');
    }, 1600);
}

if (copyAccountBtn) {
    copyAccountBtn.addEventListener('click', async () => {
        const acc = getActiveAccount();
        if (await copyToClipboard(acc.accountNumber)) {
            flashButton(copyAccountBtn, 'Đã sao chép ✓');
        }
    });
}

if (shareBtn) {
    shareBtn.addEventListener('click', async () => {
        shareBtn.disabled = true;
        try {
            const canvas = await renderBillCanvas();
            const blob = await new Promise((resolve, reject) => {
                canvas.toBlob((b) => (b ? resolve(b) : reject(new Error('Tạo ảnh thất bại'))), 'image/png');
            });

            const fileName = `cevinpay-qr-${Date.now()}.png`;
            const file = new File([blob], fileName, { type: 'image/png', lastModified: Date.now() });

            let isShared = false;

            // 1. Thử chia sẻ qua Web Share API (native share sheet)
            if (navigator.canShare && navigator.canShare({ files: [file] })) {
                try {
                    await navigator.share({
                        files: [file]
                    });
                    isShared = true;
                    flashButton(shareBtn, 'Đã chia sẻ ✓');
                } catch (shareErr) {
                    if (shareErr.name === 'AbortError') {
                        // Người dùng hủy chia sẻ từ native share sheet
                        return;
                    }
                    console.warn('Web Share API failed, using fallback:', shareErr);
                }
            }

            // 2. Dự phòng: Thử copy vào Clipboard hoặc Tải ảnh về
            if (!isShared) {
                let isCopied = false;
                if (navigator.clipboard && window.ClipboardItem) {
                    try {
                        await navigator.clipboard.write([
                            new ClipboardItem({ [blob.type]: blob })
                        ]);
                        isCopied = true;
                        flashButton(shareBtn, 'Đã copy ảnh ✓');
                    } catch (clipErr) {
                        console.warn('Clipboard copy failed:', clipErr);
                    }
                }

                if (!isCopied) {
                    const url = URL.createObjectURL(blob);
                    const link = document.createElement('a');
                    link.download = fileName;
                    link.href = url;
                    document.body.appendChild(link);
                    link.click();
                    document.body.removeChild(link);
                    setTimeout(() => URL.revokeObjectURL(url), 1000);
                    flashButton(shareBtn, 'Đã tải ảnh ✓');
                }
            }
        } catch (error) {
            console.error('Share process error:', error);
            flashButton(shareBtn, 'Lỗi chia sẻ');
        } finally {
            shareBtn.disabled = false;
        }
    });
}

/* ============ Tải bill PNG — phong cách editorial trắng/đen ============ */

const BILL_W = 1080;
const BILL_MARGIN = 96;

async function ensureBillFonts() {
    try {
        await Promise.all([
            document.fonts.load('500 24px "IBM Plex Mono"'),
            document.fonts.load('500 96px "Space Grotesk"'),
            document.fonts.load('500 30px "Inter"')
        ]);
    } catch (error) {
        /* dùng font fallback nếu không tải được */
    }
}

async function loadQrImageForBill(src) {
    if (!src) return null;

    // Fast-path: Nếu ảnh trên DOM đã nạp xong và không bị dính lỗi CORS, dùng trực tiếp để tránh delay network
    if (qrImg && qrImg.complete && qrImg.naturalWidth > 0) {
        try {
            const testCanvas = document.createElement('canvas');
            testCanvas.width = 1;
            testCanvas.height = 1;
            const testCtx = testCanvas.getContext('2d');
            testCtx.drawImage(qrImg, 0, 0, 1, 1);
            testCanvas.toDataURL();
            return qrImg;
        } catch (e) {
            /* Ảnh bị CORS canvas taint, chuyển sang proxy */
        }
    }
    
    let realUrl = src;
    if (realUrl.includes('/api/qr-proxy?url=')) {
        realUrl = decodeURIComponent(realUrl.split('/api/qr-proxy?url=')[1]);
    }

    try {
        const proxyUrl = `/api/qr-proxy?url=${encodeURIComponent(realUrl)}`;
        const response = await fetch(proxyUrl);
        if (response.ok) {
            const blob = await response.blob();
            const objectUrl = URL.createObjectURL(blob);

            return new Promise((resolve) => {
                const img = new Image();
                img.onload = () => {
                    URL.revokeObjectURL(objectUrl);
                    resolve(img);
                };
                img.onerror = () => {
                    URL.revokeObjectURL(objectUrl);
                    resolve(null);
                };
                img.src = objectUrl;
            });
        }
    } catch (error) {
        /* Bỏ qua lỗi proxy và thử nạp trực tiếp */
    }

    return new Promise((resolve) => {
        const img = new Image();
        img.crossOrigin = 'anonymous';
        img.onload = () => resolve(img);
        img.onerror = () => resolve(null);
        img.src = realUrl;
    });
}

function truncateWithEllipsis(ctx, text, maxWidth) {
    if (ctx.measureText(text).width <= maxWidth) return text;
    let truncated = text;
    while (truncated.length > 1 && ctx.measureText(`${truncated}…`).width > maxWidth) {
        truncated = truncated.slice(0, -1);
    }
    return `${truncated}…`;
}

function drawMonoText(ctx, text, x, y, { size, color, align = 'left', spacing = '3px' }) {
    ctx.save();
    try { ctx.letterSpacing = spacing; } catch (e) { /* bỏ qua nếu không hỗ trợ */ }
    ctx.font = `500 ${size}px "IBM Plex Mono", Arial, sans-serif`;
    ctx.fillStyle = color;
    ctx.textAlign = align;
    ctx.fillText(text, x, y);
    ctx.restore();
}

function drawCornerBrackets(ctx, x, y, width, height, length = 24, color = '#17171c', strokeWidth = 3) {
    ctx.save();
    ctx.strokeStyle = color;
    ctx.lineWidth = strokeWidth;
    ctx.lineCap = 'round';
    
    // Top-Left
    ctx.beginPath();
    ctx.moveTo(x, y + length);
    ctx.lineTo(x, y);
    ctx.lineTo(x + length, y);
    ctx.stroke();

    // Top-Right
    ctx.beginPath();
    ctx.moveTo(x + width - length, y);
    ctx.lineTo(x + width, y);
    ctx.lineTo(x + width, y + length);
    ctx.stroke();

    // Bottom-Left
    ctx.beginPath();
    ctx.moveTo(x, y + height - length);
    ctx.lineTo(x, y + height);
    ctx.lineTo(x + length, y + height);
    ctx.stroke();

    // Bottom-Right
    ctx.beginPath();
    ctx.moveTo(x + width - length, y + height);
    ctx.lineTo(x + width, y + height);
    ctx.lineTo(x + width, y + height - length);
    ctx.stroke();

    ctx.restore();
}

async function renderBillCanvas() {
    await ensureBillFonts();

    const acc = getActiveAccount();
    const amount = parseMoney(amountInput.value);
    const description = descriptionInput.value.trim();

    const qrImage = await loadQrImageForBill(currentQrSrc);
    const qrSide = 540;
    const qrBoxPad = 32;
    const qrBoxSide = qrSide + qrBoxPad * 2;

    const rows = [
        { label: 'NGÂN HÀNG', value: acc.shortName },
        { label: 'CHỦ TÀI KHOẢN', value: acc.accountHolder },
        { label: 'SỐ TÀI KHOẢN', value: acc.accountNumber, mono: true },
        { label: 'SỐ TIỀN', value: formatDisplayAmount(amount) },
        { label: 'NỘI DUNG', value: description || '—' }
    ];

    // Tính toán bố cục động
    let y = 175; // Khởi đầu sau header
    y += 92; // Tiêu đề
    y += 48; // Dòng phụ
    const boxY = y + 50;
    const tableTop = boxY + qrBoxSide + 90;
    const rowH = 80;
    const tableH = rows.length * rowH + 20;
    const billH = tableTop + tableH + 110;

    const canvas = document.createElement('canvas');
    canvas.width = BILL_W;
    canvas.height = billH;
    const ctx = canvas.getContext('2d');

    // Nền trang màu xám siêu nhạt (hiện đại, trẻ trung)
    ctx.fillStyle = '#f8fafc';
    ctx.fillRect(0, 0, BILL_W, billH);

    // 1. Dải Header thương hiệu đen Gradient tràn viền
    const headerH = 120;
    const headerGradient = ctx.createLinearGradient(0, 0, BILL_W, 0);
    headerGradient.addColorStop(0, '#0f172a');
    headerGradient.addColorStop(1, '#1e293b');
    ctx.fillStyle = headerGradient;
    ctx.fillRect(0, 0, BILL_W, headerH);

    // Logo & tên thương hiệu
    ctx.font = '700 36px "Space Grotesk", Arial, sans-serif';
    ctx.fillStyle = '#ffffff';
    ctx.textAlign = 'left';
    ctx.fillText('Cevin', BILL_MARGIN, 76);
    
    const logoW = ctx.measureText('Cevin').width;
    ctx.fillStyle = '#ff7759'; // Giữ chút màu nhấn thương hiệu
    ctx.fillText('Pay', BILL_MARGIN + logoW, 76);

    // Badge định danh bên phải header
    drawMonoText(ctx, 'CHUYỂN KHOẢN VIETQR', BILL_W - BILL_MARGIN, 72, {
        size: 18, color: 'rgba(255, 255, 255, 0.7)', align: 'right', spacing: '2px'
    });

    // Khôi phục y về ban đầu để vẽ tiếp
    y = 175;
    
    // Status Pill (hiện đại hơn dạng chấm tròn cũ)
    ctx.fillStyle = 'rgba(16, 185, 129, 0.1)';
    ctx.beginPath();
    ctx.roundRect(BILL_MARGIN, y - 24, 210, 40, 20);
    ctx.fill();
    
    ctx.fillStyle = '#10b981';
    ctx.beginPath();
    ctx.arc(BILL_MARGIN + 20, y - 4, 6, 0, Math.PI * 2);
    ctx.fill();

    drawMonoText(ctx, 'CHỜ THANH TOÁN', BILL_MARGIN + 36, y + 1, {
        size: 16, color: '#059669', spacing: '1px'
    });

    y += 92;
    const headline = amount ? `${formatMoney(amount)} ₫` : 'Quét để chuyển khoản';
    let headlineSize = 88;
    ctx.font = `700 ${headlineSize}px "Space Grotesk", Arial, sans-serif`;
    while (ctx.measureText(headline).width > BILL_W - BILL_MARGIN * 2 && headlineSize > 40) {
        headlineSize -= 4;
        ctx.font = `700 ${headlineSize}px "Space Grotesk", Arial, sans-serif`;
    }
    ctx.save();
    try { ctx.letterSpacing = '-2px'; } catch (e) { /* bỏ qua */ }
    ctx.fillStyle = '#0f172a'; // Tối sang trọng
    ctx.textAlign = 'left';
    ctx.fillText(headline, BILL_MARGIN, y);
    ctx.restore();

    // Dòng thông tin phụ ngân hàng + chủ tk
    y += 48;
    ctx.font = '500 26px "Inter", Arial, sans-serif';
    ctx.fillStyle = '#64748b';
    ctx.textAlign = 'left';
    ctx.fillText(`${acc.fullName} · ${acc.accountHolder}`, BILL_MARGIN, y);

    // 3. Khung mã QR hiện đại (Soft shadow glass effect)
    const boxX = (BILL_W - qrBoxSide) / 2;

    ctx.save();
    ctx.shadowColor = 'rgba(15, 23, 42, 0.08)';
    ctx.shadowBlur = 40;
    ctx.shadowOffsetY = 20;
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.roundRect(boxX, boxY, qrBoxSide, qrBoxSide, 32);
    ctx.fill();
    ctx.restore();

    // Vẽ ảnh QR
    if (qrImage) {
        ctx.imageSmoothingEnabled = true;
        ctx.drawImage(qrImage, boxX + qrBoxPad, boxY + qrBoxPad, qrSide, qrSide);
    } else {
        ctx.font = '400 26px "Inter", Arial, sans-serif';
        ctx.fillStyle = '#94a3b8';
        ctx.textAlign = 'center';
        ctx.fillText('Không tải được mã QR', BILL_W / 2, boxY + qrBoxSide / 2);
    }

    // Nhãn hướng dẫn dưới QR
    drawMonoText(ctx, 'SỬ DỤNG ỨNG DỤNG NGÂN HÀNG ĐỂ QUÉT', BILL_W / 2, boxY + qrBoxSide + 40, {
        size: 16, color: '#64748b', align: 'center', spacing: '2px'
    });

    // 4. Bảng thông tin giao dịch bo góc tinh tế
    const tableX = BILL_MARGIN;
    const tableW = BILL_W - BILL_MARGIN * 2;

    ctx.save();
    ctx.shadowColor = 'rgba(15, 23, 42, 0.04)';
    ctx.shadowBlur = 30;
    ctx.shadowOffsetY = 15;
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.roundRect(tableX, tableTop, tableW, tableH, 24);
    ctx.fill();
    ctx.restore();

    rows.forEach((row, index) => {
        const rowY = tableTop + 10 + index * rowH;
        
        if (index > 0) {
            ctx.strokeStyle = '#f1f5f9';
            ctx.lineWidth = 1.5;
            ctx.beginPath();
            ctx.moveTo(tableX + 32, rowY);
            ctx.lineTo(tableX + tableW - 32, rowY);
            ctx.stroke();
        }

        const baseline = rowY + 54;
        ctx.font = '500 20px "Inter", Arial, sans-serif';
        ctx.fillStyle = '#64748b';
        ctx.textAlign = 'left';
        ctx.fillText(row.label, tableX + 32, baseline);

        ctx.font = row.mono
            ? '500 26px "IBM Plex Mono", Arial, sans-serif'
            : '600 26px "Inter", Arial, sans-serif';
        ctx.fillStyle = (row.label === 'SỐ TIỀN' && amount) ? '#ff7759' : '#1e293b';
        ctx.textAlign = 'right';
        const value = row.mono ? row.value : truncateWithEllipsis(ctx, row.value, tableW - 300);
        ctx.fillText(value, tableX + tableW - 32, baseline);
    });

    // 5. Chân trang tối giản hiện đại - Nổi bật Đào Bá Anh Quân
    const footerY = billH - 45;
    
    const prefixText = 'HỆ THỐNG ĐƯỢC PHÁT TRIỂN BỞI ';
    const nameText = 'ĐÀO BÁ ANH QUÂN';

    ctx.save();
    try { ctx.letterSpacing = '1px'; } catch (e) {}
    
    ctx.font = '500 16px "Space Grotesk", Arial, sans-serif';
    const prefixW = ctx.measureText(prefixText).width;

    ctx.font = '700 17px "Space Grotesk", Arial, sans-serif';
    const nameW = ctx.measureText(nameText).width;

    const totalW = prefixW + nameW;
    const startX = (BILL_W - totalW) / 2;

    // Vẽ phần prefix xám nhạt
    ctx.font = '500 16px "Space Grotesk", Arial, sans-serif';
    ctx.fillStyle = '#64748b';
    ctx.textAlign = 'left';
    ctx.fillText(prefixText, startX, footerY);

    // Vẽ tên nổi bật Bold + Màu đen tối sang trọng
    ctx.font = '700 17px "Space Grotesk", Arial, sans-serif';
    ctx.fillStyle = '#0f172a';
    ctx.fillText(nameText, startX + prefixW, footerY);
    
    ctx.restore();

    return canvas;
}

if (downloadBtn) {
    downloadBtn.addEventListener('click', async () => {
        downloadBtn.disabled = true;
        try {
            const canvas = await renderBillCanvas();
            const blob = await new Promise((resolve, reject) => {
                canvas.toBlob((b) => (b ? resolve(b) : reject(new Error('toBlob thất bại'))), 'image/png');
            });
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            const acc = getActiveAccount();
            link.download = `cevinpay-qr-${acc.code.toLowerCase()}-${Date.now()}.png`;
            link.href = url;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            setTimeout(() => URL.revokeObjectURL(url), 1000);
        } catch (error) {
            console.error('Download error:', error);
            setStatus('error', 'Lỗi tải ảnh');
        } finally {
            downloadBtn.disabled = false;
        }
    });
}

/* ============ Khác ============ */

const bankLogo = document.getElementById('bankLogo');
const bankNameSpan = document.getElementById('bankNameSpan');
const accountHolder = document.getElementById('accountHolder');

if (barClose && announcementBar) {
    barClose.addEventListener('click', () => {
        announcementBar.classList.add('is-hidden');
    });
}

if (bankLogo) {
    bankLogo.addEventListener('error', function () {
        this.style.display = 'none';
    });
}

/* ============ Chuyển Tab Ngân Hàng ============ */

const bankTabBtns = document.querySelectorAll('.tab-btn');

const tpbankHistorySection = document.getElementById('tpbankHistorySection');

function updateHistorySectionVisibility() {
    const el = document.getElementById('tpbankHistorySection');
    if (!el) return;
    if (currentBankKey === 'TPB') {
        el.style.display = 'flex';
    } else {
        el.style.display = 'none';
    }
}

function switchBankTab(bankKey) {
    if (!ACCOUNTS[bankKey]) return;
    currentBankKey = bankKey;

    bankTabBtns.forEach(btn => {
        const isMatch = btn.dataset.bank === bankKey;
        btn.classList.toggle('is-active', isMatch);
        btn.setAttribute('aria-selected', isMatch ? 'true' : 'false');
    });

    const acc = getActiveAccount();
    if (bankLogo) bankLogo.src = acc.logoUrl;
    if (bankNameSpan) bankNameSpan.textContent = acc.shortName;
    if (accountValue) accountValue.textContent = acc.accountNumber;
    if (accountHolder) accountHolder.textContent = acc.accountHolder;

    updateHistorySectionVisibility();
    refreshQr();
}

bankTabBtns.forEach(btn => {
    btn.addEventListener('click', () => {
        switchBankTab(btn.dataset.bank);
    });
});

/* ============ Real-time Webhook SePay & Lịch sử TPBank ============ */

const toastContainer = document.getElementById('toastContainer');
const historyTbody = document.getElementById('historyTbody');
let tpBankHistoryList = [];

// Phát âm thanh "Ting-Ting!" nhận tiền ngân vang sang trọng (Apple Pay / POS Chime Style)
function playSuccessChime() {
    try {
        const AudioCtx = window.AudioContext || window.webkitAudioContext;
        if (!AudioCtx) return;
        const ctx = new AudioCtx();
        const now = ctx.currentTime;

        // Cấu trúc hợp âm 3 nốt ngân vang: E6 -> A6 -> C7 + E7 (Harmonic Crystal Ring kéo dài 1.5 giây)
        const notes = [
            { freq: 1318.51, time: now + 0.00, duration: 0.9, gain: 0.20 }, // E6 (Khởi đầu mượt)
            { freq: 1760.00, time: now + 0.08, duration: 1.1, gain: 0.28 }, // A6 (Nhịp lướt)
            { freq: 2093.00, time: now + 0.18, duration: 1.5, gain: 0.40 }, // C7 (Nốt Ting chính)
            { freq: 2637.02, time: now + 0.18, duration: 1.4, gain: 0.20 }  // E7 (Chuông ngọc họa âm kéo dài)
        ];

        notes.forEach(({ freq, time, duration, gain }) => {
            const osc = ctx.createOscillator();
            const gainNode = ctx.createGain();
            
            osc.type = 'sine';
            osc.frequency.setValueAtTime(freq, time);

            // Volume Envelope: Tăng tốc 4ms, giảm ngân kéo dài 1.5s cực kỳ êm ái
            gainNode.gain.setValueAtTime(0.0001, time);
            gainNode.gain.linearRampToValueAtTime(gain, time + 0.008);
            gainNode.gain.exponentialRampToValueAtTime(0.0001, time + duration);

            osc.connect(gainNode);
            gainNode.connect(ctx.destination);

            osc.start(time);
            osc.stop(time + duration);
        });
    } catch (e) {
        /* Trình duyệt chặn autoplay audio trước khi có tương tác chuột/bàn phím */
    }
}

function escapeHtml(str) {
    return String(str || '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');
}

function showToast({ type = 'dynamic', badgeText, title, amount, sender, content }) {
    if (!toastContainer) return;

    const toast = document.createElement('div');
    toast.className = `toast ${type === 'matched' ? 'toast-matched' : 'toast-dynamic'}`;

    const formattedAmount = formatMoney(amount);

    const isMatched = type === 'matched';
    const iconSvg = isMatched 
        ? `<svg class="toast-icon-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path stroke-linecap="round" stroke-linejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>`
        : `<svg class="toast-icon-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path stroke-linecap="round" stroke-linejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>`;

    toast.innerHTML = `
        <div class="toast-liquid-shine"></div>
        <div class="toast-header">
            <div class="toast-header-left">
                <span class="toast-status-icon">${iconSvg}</span>
                <span class="toast-badge">${escapeHtml(badgeText || 'THÔNG BÁO GIAO DỊCH')}</span>
            </div>
            <button type="button" class="toast-close-btn" aria-label="Đóng">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
        </div>
        
        <div class="toast-body">
            <div class="toast-amount">+${formattedAmount} <span class="currency">₫</span></div>
            <div class="toast-title">${escapeHtml(title)}</div>
        </div>

        <div class="toast-meta-card">
            ${sender ? `
            <div class="meta-item">
                <span class="meta-icon">👤</span>
                <span class="meta-label">Người gửi:</span>
                <span class="meta-value sender-highlight">${escapeHtml(sender)}</span>
            </div>` : ''}
            <div class="meta-item">
                <span class="meta-icon">📝</span>
                <span class="meta-label">Nội dung:</span>
                <span class="meta-value">${escapeHtml(content || '—')}</span>
            </div>
        </div>
    `;

    const closeBtn = toast.querySelector('.toast-close-btn');
    if (closeBtn) {
        closeBtn.addEventListener('click', () => {
            removeToast(toast);
        });
    }

    toastContainer.appendChild(toast);
    playSuccessChime();

    setTimeout(() => {
        removeToast(toast);
    }, 8000);
}

function removeToast(toast) {
    if (toast.classList.contains('is-hiding')) return;
    toast.classList.add('is-hiding');
    setTimeout(() => {
        if (toast.parentNode) {
            toast.parentNode.removeChild(toast);
        }
    }, 300);
}

function parseSenderInfo(tx) {
    if (!tx) return 'Khách hàng';
    let content = (tx.content || '').trim();
    if (!content) {
        return tx.referenceCode ? `Mã GD: ${tx.referenceCode}` : (tx.gateway || 'Khách hàng');
    }

    // Lược bỏ các tiền tố ngân hàng phổ biến ở đầu câu
    const cleanContent = content.replace(/^(IBFT|MBVCB|VCB|TCB|TPB|VMB|BIDV|Agribank|Vietinbank|NAPAS|CT\s+TU\s+\d+|CT\s+TU|NHAN\s+TU|TU)\s+[:.-]?\s*/i, '').trim();

    // 1. Tách tên đứng đầu câu trước các từ khóa "chuyen tien", "chuyen", "ck", "thanh toan", "FT...", v.v.
    const stopRegex = /\s+(chuyen\s+tien|chuyen\s+khoan|chuyen|chuyển\s+tiền|chuyển|ck|thanh\s+toan|thanh\s+toán|tt|ft\d+|ref\d+|ma\s+gd|-\s+)/i;
    const parts = cleanContent.split(stopRegex);
    
    if (parts && parts[0]) {
        const potentialName = parts[0].trim();
        const words = potentialName.split(/\s+/);
        
        // Tên hợp lệ: 2 đến 6 từ, chứa chữ cái tiếng Việt / La Tinh
        if (words.length >= 2 && words.length <= 6) {
            const isName = words.every(w => 
                /^[A-ZÀÁÂÃÈÉÊÌÍÒÓÔÕÙÚÝĂĐĨŨƠƯẠ-Ỹa-zàáâãèéêìíòóôõùúýăđĩũơưạ-ỹ]+$/.test(w)
            );
            if (isName) {
                return potentialName;
            }
        }
    }

    // 2. Dự phòng 1: Chuỗi từ VIẾT HOA hoàn toàn ở đầu
    const matchAllCaps = cleanContent.match(/^([A-ZÀÁÂÃÈÉÊÌÍÒÓÔÕÙÚÝĂĐĨŨƠƯẠ-Ỹ]{2,}(\s+[A-ZÀÁÂÃÈÉÊÌÍÒÓÔÕÙÚÝĂĐĨŨƠƯẠ-Ỹ]{2,}){1,5})/);
    if (matchAllCaps && matchAllCaps[1]) {
        return matchAllCaps[1].trim();
    }

    // 3. Dự phòng 2: Chuỗi từ Viết Hoa Chữ Cái Đầu ở đầu
    const matchTitleCase = cleanContent.match(/^([A-ZÀÁÂÃÈÉÊÌÍÒÓÔÕÙÚÝĂĐĨŨƠƯẠ-Ỹ][a-zàáâãèéêìíòóôõùúýăđĩũơưạ-ỹ]+(\s+[A-ZÀÁÂÃÈÉÊÌÍÒÓÔÕÙÚÝĂĐĨŨƠƯẠ-Ỹ][a-zàáâãèéêìíòóôõùúýăđĩũơưạ-ỹ]+){1,5})/);
    if (matchTitleCase && matchTitleCase[1]) {
        return matchTitleCase[1].trim();
    }

    // 4. Nếu không phải tên người gửi thì dùng Mã GD hoặc Cổng
    if (tx.referenceCode) return `Mã GD: ${tx.referenceCode}`;
    return tx.gateway ? `Cổng ${tx.gateway}` : 'Khách hàng';
}

function renderHistoryTable(isNew = false) {
    if (!historyTbody) return;

    const displayList = tpBankHistoryList.slice(0, 5);

    if (displayList.length === 0) {
        historyTbody.innerHTML = `
            <tr class="empty-row">
                <td colspan="4">Chưa có giao dịch TPBank nào</td>
            </tr>
        `;
        return;
    }

    historyTbody.innerHTML = displayList.map((tx, index) => {
        const isLatest = isNew && index === 0;
        const timeStr = tx.transactionDate || (tx.receivedAt ? new Date(tx.receivedAt).toLocaleTimeString('vi-VN') : '—');
        const amountStr = `+${formatMoney(tx.transferAmount)} ₫`;
        const senderStr = parseSenderInfo(tx);
        const contentStr = tx.content || '—';

        return `
            <tr class="${isLatest ? 'new-row' : ''}">
                <td class="time-cell">${escapeHtml(timeStr)}</td>
                <td class="amount-cell">${amountStr}</td>
                <td>${escapeHtml(senderStr)}</td>
                <td>${escapeHtml(contentStr)}</td>
            </tr>
        `;
    }).join('');
}

const processedClientTxIds = new Set();
let isInitialLoadComplete = false;

/* ============ Thông báo đẩy Hệ điều hành (OS Push Notification) ============ */

const enableNotifBtn = document.getElementById('enableNotifBtn');

function updateNotifButtonState() {
    if (!enableNotifBtn) return;
    if (!('Notification' in window)) {
        enableNotifBtn.style.display = 'none';
        return;
    }

    if (Notification.permission === 'granted') {
        // Người dùng đã bật thông báo hệ thống -> Tự động ẩn nút
        enableNotifBtn.style.display = 'none';
    } else if (Notification.permission === 'denied') {
        enableNotifBtn.style.display = 'inline-flex';
        enableNotifBtn.textContent = '🔕 Thông báo bị chặn';
        enableNotifBtn.disabled = true;
    } else {
        enableNotifBtn.style.display = 'inline-flex';
        enableNotifBtn.textContent = '🔔 Bật thông báo hệ thống';
        enableNotifBtn.disabled = false;
        enableNotifBtn.classList.remove('is-granted');
    }
}

if (enableNotifBtn) {
    enableNotifBtn.addEventListener('click', async () => {
        if (!('Notification' in window)) return;
        const perm = await Notification.requestPermission();
        updateNotifButtonState();
        if (perm === 'granted') {
            sendSystemNotification({
                title: 'CevinPay — Đã bật thông báo hệ thống 🟢',
                body: 'Bạn sẽ nhận được thông báo đẩy tức thì khi tiền về tài khoản TPBank.',
                tag: 'status-update'
            });
        }
    });
}

function sendSystemNotification({ title, body, icon = '/image-192.png', tag = 'tpbank-payment' }) {
    if (!('Notification' in window) || Notification.permission !== 'granted') return;

    try {
        if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
            navigator.serviceWorker.ready.then((reg) => {
                reg.showNotification(title, {
                    body,
                    icon,
                    badge: icon,
                    tag,
                    vibrate: [200, 100, 200, 100, 200],
                    renotify: true,
                    silent: false,
                    data: { url: '/' }
                });
            });
        } else {
            new Notification(title, { body, icon, vibrate: [200, 100, 200], tag, renotify: true, silent: false });
        }
    } catch (e) {
        console.warn('Không gửi được thông báo hệ thống:', e);
    }
}

function handleIncomingTpBankPayment(tx, isInitial = false) {
    if (!tx || !tx.id) return;
    const strId = String(tx.id);
    if (processedClientTxIds.has(strId)) return;
    processedClientTxIds.add(strId);

    console.log('⚡ Xử lý giao dịch TPBank:', tx);

    // Cập nhật danh sách lịch sử
    tpBankHistoryList.unshift(tx);
    if (tpBankHistoryList.length > 50) tpBankHistoryList.pop();
    renderHistoryTable(!isInitial);

    // Không nổ Toast hay phát âm thanh nếu đây là lần nạp dữ liệu ban đầu khi mới mở trang
    if (isInitial || !isInitialLoadComplete) return;

    // Bật thông báo Toast nhận tiền TPBank
    const currentAmount = parseMoney(amountInput.value);

    if (currentBankKey === 'TPB' && currentAmount) {
        const expectedAmount = parseInt(currentAmount, 10);
        const receivedAmount = parseInt(tx.transferAmount, 10);

        if (receivedAmount === expectedAmount) {
            showToast({
                type: 'matched',
                badgeText: 'XÁC NHẬN KHỚP SỐ TIỀN ✓',
                title: 'Đã nhận đúng số tiền trên mã QR TPBank!',
                amount: tx.transferAmount,
                sender: parseSenderInfo(tx),
                content: tx.content
            });
            setStatus('ready', 'Đã thanh toán ✓');
            return;
        }
    }

    showToast({
        type: 'dynamic',
        badgeText: 'NHẬN CHUYỂN KHOẢN TPBANK',
        title: 'Tài khoản TPBank vừa nhận tiền',
        amount: tx.transferAmount,
        sender: parseSenderInfo(tx),
        content: tx.content
    });
}

async function loadInitialTransactions() {
    try {
        const res = await fetch('/api/transactions', { cache: 'no-store' });
        if (res && res.ok) {
            const data = await res.json().catch(() => null);
            if (data && data.success && Array.isArray(data.transactions)) {
                tpBankHistoryList = [];
                for (let i = data.transactions.length - 1; i >= 0; i--) {
                    const tx = data.transactions[i];
                    if (tx && tx.id) {
                        handleIncomingTpBankPayment(tx, true);
                    }
                }
            }
        }
    } catch (e) {
        console.warn('Lỗi tải lịch sử giao dịch:', e);
    } finally {
        isInitialLoadComplete = true;
    }
}

let pollingIntervalId = null;

function startPollingFallback() {
    if (pollingIntervalId) {
        clearInterval(pollingIntervalId);
        pollingIntervalId = null;
    }
    // Polling dự phòng nhẹ nhàng mỗi 10 giây (giảm tần suất spam và tránh bị extension trình duyệt can thiệp)
    pollingIntervalId = setInterval(async () => {
        try {
            const res = await fetch('/api/transactions', { cache: 'no-store' });
            if (res && res.ok) {
                const data = await res.json().catch(() => null);
                if (data && data.success && Array.isArray(data.transactions)) {
                    for (let i = data.transactions.length - 1; i >= 0; i--) {
                        const tx = data.transactions[i];
                        if (tx && tx.id && !processedClientTxIds.has(String(tx.id))) {
                            handleIncomingTpBankPayment(tx, false);
                        }
                    }
                }
            }
        } catch (e) {
            /* Bỏ qua lỗi polling định kỳ */
        }
    }, 10000);
}

let activeEventSource = null;
let cloudEventSource = null;

function initRealtimeEvents() {
    if (activeEventSource) {
        try { activeEventSource.close(); } catch (e) {}
        activeEventSource = null;
    }
    if (cloudEventSource) {
        try { cloudEventSource.close(); } catch (e) {}
        cloudEventSource = null;
    }

    if (window.EventSource) {
        // 1. Kết nối SSE nội bộ (dành cho local server)
        try {
            activeEventSource = new EventSource('/api/events');
            activeEventSource.addEventListener('tpbank_payment', (e) => {
                try {
                    const tx = JSON.parse(e.data);
                    handleIncomingTpBankPayment(tx, false);
                } catch (err) {}
            });
        } catch (e) {}

        // 2. Kết nối Kênh Cloud SSE siêu tốc (dành cho Vercel & Production)
        try {
            cloudEventSource = new EventSource('https://ntfy.sh/cevinpay_sepay_webhook_tpbank_10002150181/sse');
            cloudEventSource.onmessage = (e) => {
                try {
                    const payload = JSON.parse(e.data);
                    if (payload && payload.message) {
                        const tx = JSON.parse(payload.message);
                        handleIncomingTpBankPayment(tx, false);
                    }
                } catch (err) {}
            };
        } catch (e) {}
    }

    startPollingFallback();
}

window.addEventListener('beforeunload', () => {
    if (activeEventSource) {
        try { activeEventSource.close(); } catch (e) {}
    }
    if (cloudEventSource) {
        try { cloudEventSource.close(); } catch (e) {}
    }
});

/* ============ Khởi tạo ============ */

function initApp() {
    ensureBillFonts();
    const acc = getActiveAccount();
    if (bankLogo) bankLogo.src = acc.logoUrl;
    if (bankNameSpan) bankNameSpan.textContent = acc.shortName;
    if (accountValue) accountValue.textContent = acc.accountNumber;
    if (accountHolder) accountHolder.textContent = acc.accountHolder;
    updateDetailRows('', '');
    const initialQrUrl = buildDirectQrUrl('');
    currentQrSrc = initialQrUrl;
    qrImg.src = initialQrUrl;

    updateHistorySectionVisibility();
    updateNotifButtonState();
    loadInitialTransactions();
    initRealtimeEvents();
}

document.addEventListener('DOMContentLoaded', updateHistorySectionVisibility);
initApp();

