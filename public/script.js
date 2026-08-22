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
const deeplinkBtn = document.getElementById('deeplinkBtn');
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

function buildDirectQrUrl(addInfo) {
    const acc = getActiveAccount();
    const params = new URLSearchParams();
    if (addInfo) params.set('addInfo', addInfo);
    const query = params.toString();
    return `https://img.vietqr.io/image/${acc.bin}-${acc.accountNumber}-qr_only.png${query ? `?${query}` : ''}`;
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
    return data.qrCode;
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
    currentQrSrc = src;
    if (qrImg.getAttribute('src') === src) {
        qrFrame.classList.remove('is-refreshing');
        setStatus('ready', 'Sẵn sàng nhận');
        return;
    }
    qrImg.src = src;
}

qrImg.addEventListener('load', () => {
    qrFrame.classList.remove('is-refreshing');
    setStatus('ready', 'Sẵn sàng nhận');
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

copyAccountBtn.addEventListener('click', async () => {
    const acc = getActiveAccount();
    if (await copyToClipboard(acc.accountNumber)) {
        flashButton(copyAccountBtn, 'Đã sao chép ✓');
    }
});

function buildVietQrDeeplink(amount, description) {
    const acc = getActiveAccount();
    const app = acc.code.toLowerCase();
    const params = new URLSearchParams({
        app,
        ba: `${acc.accountNumber}@${app}`
    });
    if (amount) params.set('am', amount);
    if (description) params.set('tn', description);
    return `https://dl.vietqr.io/pay?${params.toString()}`;
}

deeplinkBtn.addEventListener('click', async () => {
    const amount = parseMoney(amountInput.value);
    const description = descriptionInput.value.trim();
    const deeplink = buildVietQrDeeplink(amount, description);
    if (await copyToClipboard(deeplink)) {
        flashButton(deeplinkBtn, 'Đã sao chép ✓');
    }
});

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

    const rowH = 88;
    const tableTop = 1140;
    const tableH = rows.length * rowH + 20;
    const billH = tableTop + tableH + 160;

    const canvas = document.createElement('canvas');
    canvas.width = BILL_W;
    canvas.height = billH;
    const ctx = canvas.getContext('2d');

    // Nền trang màu trắng
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, BILL_W, billH);

    // Viền khung toàn bộ ảnh (Framed document look)
    ctx.strokeStyle = '#e5e7eb';
    ctx.lineWidth = 2;
    ctx.strokeRect(16, 16, BILL_W - 32, billH - 32);

    // 1. Dải Header thương hiệu đen mờ
    ctx.fillStyle = '#17171c';
    ctx.fillRect(24, 24, BILL_W - 48, 88);

    // Logo & tên thương hiệu
    ctx.font = '700 30px "Space Grotesk", Arial, sans-serif';
    ctx.fillStyle = '#ffffff';
    ctx.textAlign = 'left';
    ctx.fillText('Cevin', BILL_MARGIN, 78);
    
    const logoW = ctx.measureText('Cevin').width;
    ctx.fillStyle = '#ff7759';
    ctx.fillText('Pay', BILL_MARGIN + logoW, 78);

    // Badge định danh bên phải header
    drawMonoText(ctx, 'CHUYỂN KHOẢN VIETQR', BILL_W - BILL_MARGIN, 76, {
        size: 18, color: 'rgba(255, 255, 255, 0.75)', align: 'right', spacing: '3px'
    });

    // 2. Eyebrow status & Tiêu đề số tiền
    let y = 175;
    
    // Status Dot xanh nhấp nháy
    ctx.fillStyle = '#10b981';
    ctx.beginPath();
    ctx.arc(BILL_MARGIN + 6, y - 7, 7, 0, Math.PI * 2);
    ctx.fill();

    drawMonoText(ctx, 'SẴN SÀNG NHẬN', BILL_MARGIN + 24, y, {
        size: 20, color: '#ff7759', spacing: '2px'
    });

    y += 98;
    const headline = amount ? `${formatMoney(amount)} ₫` : 'Quét để chuyển khoản';
    let headlineSize = 92;
    ctx.font = `500 ${headlineSize}px "Space Grotesk", Arial, sans-serif`;
    while (ctx.measureText(headline).width > BILL_W - BILL_MARGIN * 2 && headlineSize > 44) {
        headlineSize -= 4;
        ctx.font = `500 ${headlineSize}px "Space Grotesk", Arial, sans-serif`;
    }
    ctx.save();
    try { ctx.letterSpacing = '-2px'; } catch (e) { /* bỏ qua */ }
    ctx.fillStyle = '#000000';
    ctx.textAlign = 'left';
    ctx.fillText(headline, BILL_MARGIN, y);
    ctx.restore();

    // Dòng thông tin phụ ngân hàng + chủ tk
    y += 54;
    ctx.font = '400 28px "Inter", Arial, sans-serif';
    ctx.fillStyle = '#75758a';
    ctx.textAlign = 'left';
    ctx.fillText(`${acc.fullName} · ${acc.accountHolder}`, BILL_MARGIN, y);

    // 3. Khung mã QR nổi bật với góc định vị Tech Corner Brackets
    const boxX = (BILL_W - qrBoxSide) / 2;
    const boxY = y + 50;

    // Nền xám nhạt cho khung QR
    ctx.fillStyle = '#f8f9fa';
    ctx.beginPath();
    ctx.roundRect(boxX, boxY, qrBoxSide, qrBoxSide, 20);
    ctx.fill();

    ctx.strokeStyle = '#e2e4e8';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.roundRect(boxX, boxY, qrBoxSide, qrBoxSide, 20);
    ctx.stroke();

    // Vẽ 4 góc định vị công nghệ
    drawCornerBrackets(ctx, boxX - 8, boxY - 8, qrBoxSide + 16, qrBoxSide + 16, 28, '#17171c', 3);

    // Vẽ ảnh QR
    if (qrImage) {
        ctx.imageSmoothingEnabled = false;
        ctx.drawImage(qrImage, boxX + qrBoxPad, boxY + qrBoxPad, qrSide, qrSide);
    } else {
        ctx.font = '400 26px "IBM Plex Mono", Arial, sans-serif';
        ctx.fillStyle = '#93939f';
        ctx.textAlign = 'center';
        ctx.fillText('Không tải được mã QR', BILL_W / 2, boxY + qrBoxSide / 2);
    }

    // Nhãn hướng dẫn dưới QR
    drawMonoText(ctx, '[ SỬ DỤNG ỨNG DỤNG NGÂN HÀNG ĐỂ QUÉT ]', BILL_W / 2, boxY + qrBoxSide + 38, {
        size: 17, color: '#93939f', align: 'center', spacing: '2px'
    });

    // 4. Bảng thông tin giao dịch trong card bo tròn
    const tableX = BILL_MARGIN;
    const tableW = BILL_W - BILL_MARGIN * 2;

    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.roundRect(tableX, tableTop, tableW, tableH, 16);
    ctx.fill();

    ctx.strokeStyle = '#e5e7eb';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.roundRect(tableX, tableTop, tableW, tableH, 16);
    ctx.stroke();

    rows.forEach((row, index) => {
        const rowY = tableTop + 10 + index * rowH;
        
        if (index > 0) {
            ctx.strokeStyle = '#f2f2f5';
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(tableX + 24, rowY);
            ctx.lineTo(tableX + tableW - 24, rowY);
            ctx.stroke();
        }

        const baseline = rowY + 54;
        drawMonoText(ctx, row.label, tableX + 24, baseline, { size: 20, color: '#75758a', spacing: '2px' });

        ctx.font = row.mono
            ? '500 28px "IBM Plex Mono", Arial, sans-serif'
            : '500 30px "Inter", Arial, sans-serif';
        ctx.fillStyle = (row.label === 'SỐ TIỀN' && amount) ? '#ff7759' : '#17171c';
        ctx.textAlign = 'right';
        const value = row.mono ? row.value : truncateWithEllipsis(ctx, row.value, tableW - 320);
        ctx.fillText(value, tableX + tableW - 24, baseline);
    });

    // 5. Đường gạch đứt chân trang & Mã xác thực
    const footerY = billH - 70;
    
    ctx.save();
    ctx.strokeStyle = '#d9d9dd';
    ctx.lineWidth = 2;
    ctx.setLineDash([8, 6]);
    ctx.beginPath();
    ctx.moveTo(BILL_MARGIN, footerY - 30);
    ctx.lineTo(BILL_W - BILL_MARGIN, footerY - 30);
    ctx.stroke();
    ctx.restore();

    drawMonoText(ctx, 'XÁC THỰC BỞI VIETQR.IO · NAPAS 247', BILL_MARGIN, footerY + 6, {
        size: 18, color: '#93939f', align: 'left', spacing: '2px'
    });

    const timestamp = new Date().toISOString().slice(0, 10);
    drawMonoText(ctx, `CEVINPAY SECURITY · ${timestamp}`, BILL_W - BILL_MARGIN, footerY + 6, {
        size: 18, color: '#93939f', align: 'right', spacing: '2px'
    });

    return canvas;
}

downloadBtn.addEventListener('click', async () => {
    downloadBtn.disabled = true;
    try {
        const canvas = await renderBillCanvas();
        const blob = await new Promise((resolve, reject) => {
            canvas.toBlob((b) => (b ? resolve(b) : reject(new Error('toBlob thất bại'))), 'image/png');
        });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.download = `cevinpay-qr-techcombank-${Date.now()}.png`;
        link.href = url;
        link.click();
        URL.revokeObjectURL(url);
    } catch (error) {
        console.error('Download error:', error);
        setStatus('error', 'Lỗi tải ảnh');
    } finally {
        downloadBtn.disabled = false;
    }
});

/* ============ Khác ============ */

if (barClose && announcementBar) {
    barClose.addEventListener('click', () => {
        announcementBar.classList.add('is-hidden');
    });
}

document.getElementById('bankLogo').addEventListener('error', function () {
    this.style.display = 'none';
});

/* ============ Chuyển Tab Ngân Hàng ============ */

const bankTabBtns = document.querySelectorAll('.tab-btn');
const bankLogo = document.getElementById('bankLogo');
const bankNameSpan = document.getElementById('bankNameSpan');
const accountHolder = document.getElementById('accountHolder');

function switchBankTab(bankKey) {
    if (!ACCOUNTS[bankKey] || bankKey === currentBankKey) return;
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

    refreshQr();
}

bankTabBtns.forEach(btn => {
    btn.addEventListener('click', () => {
        switchBankTab(btn.dataset.bank);
    });
});

/* ============ Khởi tạo ============ */

function initApp() {
    const acc = getActiveAccount();
    if (bankLogo) bankLogo.src = acc.logoUrl;
    if (bankNameSpan) bankNameSpan.textContent = acc.shortName;
    if (accountValue) accountValue.textContent = acc.accountNumber;
    if (accountHolder) accountHolder.textContent = acc.accountHolder;
    updateDetailRows('', '');
    const initialQrUrl = buildDirectQrUrl('');
    currentQrSrc = initialQrUrl;
    qrImg.src = initialQrUrl;
}

initApp();
