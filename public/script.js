const VIETQR_BANKS_API = 'https://api.vietqr.io/v2/banks';
const BANK_NAMES = {};
const BANK_LOGOS = {};
const BANK_IDS_BY_CODE = {};
const BANK_META_BY_BIN = {};
let bankOptionsCache = [];
let lastQrPayload = null;

async function loadBanks() {
    const bankSelect = document.getElementById('bankCode');
    const bankOptions = document.getElementById('bankOptions');

    try {
        const response = await fetch(VIETQR_BANKS_API);
        const data = await response.json();

        if (!data || data.code !== '00' || !Array.isArray(data.data)) {
            throw new Error('Bank list response is invalid');
        }

        const sortedBanks = data.data
            .filter((bank) => bank && bank.bin && bank.shortName)
            .sort((a, b) => String(a.shortName).localeCompare(String(b.shortName), 'vi'));

        bankOptions.innerHTML = '';
        bankOptionsCache = [];

        sortedBanks.forEach((bank) => {
            const bankId = String(bank.bin);
            const displayName = `${bank.shortName} - ${bank.name}`;

            BANK_NAMES[bankId] = bank.shortName || bank.name || bankId;
            if (bank.logo) {
                BANK_LOGOS[bankId] = bank.logo;
            }
            if (bank.code) {
                BANK_IDS_BY_CODE[String(bank.code).toUpperCase()] = bankId;
            }
            if (bank.shortName) {
                BANK_IDS_BY_CODE[String(bank.shortName).toUpperCase()] = bankId;
            }

            BANK_META_BY_BIN[bankId] = {
                code: bank.code || bank.shortName || '',
                shortName: bank.shortName || '',
                name: bank.name || ''
            };

            const option = document.createElement('li');
            option.className = 'bank-option';
            option.dataset.bankId = bankId;
            option.dataset.label = displayName;
            option.textContent = displayName;
            bankOptions.appendChild(option);
            bankOptionsCache.push(option);
        });

        setSelectedBank('');
    } catch (error) {
        console.error('Failed to load bank list:', error);
        alert('❌ Không tải được danh sách ngân hàng. Vui lòng thử lại sau.');
    }
}

// Hàm tạo bill QR phong cách trẻ trung, hiện đại
async function createQRBill(qrImageUrl, bankCode, accountNumber, amount, description) {
    const canvas = document.getElementById('qrCanvas');
    const ctx = canvas.getContext('2d');

    // Kích thước vé
    const width = 520;
    const height = 800;
    canvas.width = width;
    canvas.height = height;

    // ===== NỀN GRADIENT MỀM MẠI =====
    const bgGradient = ctx.createLinearGradient(0, 0, width, height);
    bgGradient.addColorStop(0, '#fef3c7');
    bgGradient.addColorStop(0.5, '#fef9c3');
    bgGradient.addColorStop(1, '#fef3c7');
    ctx.fillStyle = bgGradient;
    ctx.fillRect(0, 0, width, height);

    // ===== HOA VĂN TRANG TRÍ - VÒNG TRÒN MÀU SẮC =====
    // Vòng tròn lớn góc trên trái
    ctx.globalAlpha = 0.15;
    ctx.fillStyle = '#0066FF';
    ctx.beginPath();
    ctx.arc(-30, -30, 120, 0, Math.PI * 2);
    ctx.fill();

    // Vòng tròn nhỏ góc trên phải
    ctx.fillStyle = '#FFB800';
    ctx.beginPath();
    ctx.arc(width + 30, 80, 80, 0, Math.PI * 2);
    ctx.fill();

    // Vòng tròn góc dưới trái
    ctx.fillStyle = '#10b981';
    ctx.beginPath();
    ctx.arc(60, height + 40, 100, 0, Math.PI * 2);
    ctx.fill();

    // Vòng tròn nhỏ rải rác
    ctx.fillStyle = '#0066FF';
    ctx.beginPath();
    ctx.arc(width - 80, height - 120, 50, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#FFB800';
    ctx.beginPath();
    ctx.arc(100, 400, 35, 0, Math.PI * 2);
    ctx.fill();

    ctx.globalAlpha = 1;

    // ===== KHUNG TRẮNG CHÍNH BO TRÒN =====
    ctx.shadowColor = 'rgba(0, 0, 0, 0.1)';
    ctx.shadowBlur = 30;
    ctx.shadowOffsetY = 10;
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.roundRect(30, 30, width - 60, height - 60, 35);
    ctx.fill();

    // Tắt bóng
    ctx.shadowColor = 'transparent';
    ctx.shadowBlur = 0;

    // ===== ĐƯỜNG VIỀN MÀU TRÊN KHUNG =====
    const borderGradient = ctx.createLinearGradient(30, 30, width - 30, 30);
    borderGradient.addColorStop(0, '#FFB800');
    borderGradient.addColorStop(0.5, '#0066FF');
    borderGradient.addColorStop(1, '#FFB800');
    ctx.strokeStyle = borderGradient;
    ctx.lineWidth = 5;
    ctx.beginPath();
    ctx.moveTo(65, 30);
    ctx.lineTo(width - 65, 30);
    ctx.stroke();

    // Đường viền dưới
    const borderGradient2 = ctx.createLinearGradient(30, height - 30, width - 30, height - 30);
    borderGradient2.addColorStop(0, '#0066FF');
    borderGradient2.addColorStop(0.5, '#FFB800');
    borderGradient2.addColorStop(1, '#0066FF');
    ctx.strokeStyle = borderGradient2;
    ctx.beginPath();
    ctx.moveTo(65, height - 30);
    ctx.lineTo(width - 65, height - 30);
    ctx.stroke();

    // ===== HEADER - BRAND NAME =====
    ctx.textAlign = 'center';

    // Vẽ hình tròn trang trí bên trái
    ctx.fillStyle = '#FFB800';
    ctx.beginPath();
    ctx.arc(120, 90, 12, 0, Math.PI * 2);
    ctx.fill();

    // Vẽ hình tròn trang trí bên phải
    ctx.fillStyle = '#0066FF';
    ctx.beginPath();
    ctx.arc(width - 120, 90, 12, 0, Math.PI * 2);
    ctx.fill();

    // Brand text
    ctx.font = 'bold 52px Arial, sans-serif';
    const cevinText = 'Cevin';
    const payText = 'Pay';
    const cevinWidth = ctx.measureText(cevinText).width;
    const totalWidth = ctx.measureText('CevinPay').width;

    // "Cevin" màu vàng
    ctx.fillStyle = '#FFB800';
    ctx.fillText(cevinText, width / 2 - totalWidth / 2 + cevinWidth / 2, 100);

    // "Pay" màu xanh
    ctx.fillStyle = '#0066FF';
    ctx.fillText(payText, width / 2 - totalWidth / 2 + cevinWidth + ctx.measureText(payText).width / 2, 100);

    // ===== LOAD QR CODE =====
    const qrImg = new Image();
    qrImg.crossOrigin = 'anonymous';

    return new Promise((resolve) => {
        qrImg.onload = async () => {
            // ===== KHUNG QR CODE BO TRÒN =====
            const qrSize = 290;
            const qrX = (width - qrSize) / 2;
            const qrY = 140;

            // Nền trắng cho QR
            ctx.shadowColor = 'rgba(0, 0, 0, 0.12)';
            ctx.shadowBlur = 25;
            ctx.shadowOffsetY = 8;

            ctx.fillStyle = '#ffffff';
            ctx.beginPath();
            ctx.roundRect(qrX - 20, qrY - 20, qrSize + 40, qrSize + 40, 25);
            ctx.fill();

            // Đường viền gradient cho QR
            ctx.shadowColor = 'transparent';
            ctx.shadowBlur = 0;

            // Viền trên
            ctx.strokeStyle = '#FFB800';
            ctx.lineWidth = 4;
            ctx.beginPath();
            ctx.moveTo(qrX - 20 + 25, qrY - 20);
            ctx.lineTo(qrX + qrSize + 20 - 25, qrY - 20);
            ctx.stroke();

            // Viền phải
            ctx.strokeStyle = '#0066FF';
            ctx.beginPath();
            ctx.moveTo(qrX + qrSize + 20, qrY - 20 + 25);
            ctx.lineTo(qrX + qrSize + 20, qrY + qrSize + 20 - 25);
            ctx.stroke();

            // Viền dưới
            ctx.strokeStyle = '#0066FF';
            ctx.beginPath();
            ctx.moveTo(qrX + qrSize + 20 - 25, qrY + qrSize + 20);
            ctx.lineTo(qrX - 20 + 25, qrY + qrSize + 20);
            ctx.stroke();

            // Viền trái
            ctx.strokeStyle = '#FFB800';
            ctx.beginPath();
            ctx.moveTo(qrX - 20, qrY + qrSize + 20 - 25);
            ctx.lineTo(qrX - 20, qrY - 20 + 25);
            ctx.stroke();

            // Vẽ QR code
            ctx.drawImage(qrImg, qrX, qrY, qrSize, qrSize);

            // Góc trang trí cho khung QR
            ctx.fillStyle = '#FFB800';
            ctx.beginPath();
            ctx.arc(qrX - 20, qrY - 20, 8, 0, Math.PI * 2);
            ctx.fill();

            ctx.fillStyle = '#0066FF';
            ctx.beginPath();
            ctx.arc(qrX + qrSize + 20, qrY - 20, 8, 0, Math.PI * 2);
            ctx.fill();

            ctx.beginPath();
            ctx.arc(qrX + qrSize + 20, qrY + qrSize + 20, 8, 0, Math.PI * 2);
            ctx.fill();

            ctx.fillStyle = '#FFB800';
            ctx.beginPath();
            ctx.arc(qrX - 20, qrY + qrSize + 20, 8, 0, Math.PI * 2);
            ctx.fill();

            // ===== ĐƯỜNG NGANG TRANG TRÍ =====
            const lineY = qrY + qrSize + 70;

            // Đường kẻ đứt
            ctx.strokeStyle = '#ddd';
            ctx.lineWidth = 2;
            ctx.setLineDash([8, 6]);
            ctx.beginPath();
            ctx.moveTo(60, lineY);
            ctx.lineTo(width - 60, lineY);
            ctx.stroke();
            ctx.setLineDash([]);

            // Hai chấm tròn đầu đường
            ctx.fillStyle = '#0066FF';
            ctx.beginPath();
            ctx.arc(60, lineY, 6, 0, Math.PI * 2);
            ctx.fill();

            ctx.fillStyle = '#FFB800';
            ctx.beginPath();
            ctx.arc(width - 60, lineY, 6, 0, Math.PI * 2);
            ctx.fill();

            // ===== SỐ TIỀN =====
            ctx.textAlign = 'center';
            ctx.font = '600 18px Arial, sans-serif';
            ctx.fillStyle = '#6b7280';
            ctx.fillText('Số tiền', width / 2, lineY + 35);

            const formattedAmount = parseInt(amount).toLocaleString('vi-VN');
            ctx.font = 'bold 42px Arial, sans-serif';
            ctx.fillStyle = '#0066FF';
            ctx.fillText(formattedAmount + ' VNĐ', width / 2, lineY + 85);

            // ===== LOGO NGÂN HÀNG =====
            const bankLogoUrl = BANK_LOGOS[bankCode];
            if (bankLogoUrl) {
                const bankLogo = new Image();
                bankLogo.crossOrigin = 'anonymous';

                bankLogo.onload = () => {
                    const maxLogoWidth = 200;
                    const maxLogoHeight = 55;
                    const naturalWidth = bankLogo.naturalWidth;
                    const naturalHeight = bankLogo.naturalHeight;

                    let logoWidth = naturalWidth;
                    let logoHeight = naturalHeight;
                    const ratio = Math.min(maxLogoWidth / naturalWidth, maxLogoHeight / naturalHeight);
                    logoWidth = naturalWidth * ratio;
                    logoHeight = naturalHeight * ratio;

                    const logoX = (width - logoWidth) / 2;
                    const logoY = lineY + 110;

                    // Bóng cho logo
                    ctx.shadowColor = 'rgba(0, 0, 0, 0.08)';
                    ctx.shadowBlur = 10;
                    ctx.drawImage(bankLogo, logoX, logoY, logoWidth, logoHeight);
                    ctx.shadowColor = 'transparent';

                    // Số tài khoản
                    let currentY = logoY + logoHeight + 45;
                    ctx.font = '600 23px Arial, sans-serif';
                    ctx.fillStyle = '#374151';
                    ctx.fillText('STK: ' + accountNumber, width / 2, currentY);

                    // ===== FOOTER - ĐƯA XUỐNG DƯỚI CÙNG =====
                    ctx.font = '500 14px Arial, sans-serif';
                    ctx.fillStyle = '#9ca3af';
                    ctx.fillText('Generated via CevinPay', width / 2, height - 55);

                    // ===== NỘI DUNG CHUYỂN KHOẢN - ĐƯA XUỐNG DƯỚI SỐ TÀI KHOẢN =====
                    if (description && description.trim()) {
                        currentY += 26;

                        ctx.font = 'italic 18px Arial, sans-serif';
                        ctx.fillStyle = '#6b7280';
                        ctx.fillText('"' + description + '"', width / 2, currentY);
                    }

                    resolve();
                };

                bankLogo.onerror = () => {
                    drawYouthfulFallback(ctx, width, height, lineY, BANK_NAMES[bankCode], accountNumber, description);
                    resolve();
                };

                bankLogo.src = bankLogoUrl;
            } else {
                drawYouthfulFallback(ctx, width, height, lineY, BANK_NAMES[bankCode], accountNumber, description);
                resolve();
            }
        };

        qrImg.onerror = () => {
            console.error('Failed to load QR image');
            resolve();
        };

        qrImg.src = qrImageUrl;
    });
}

// Hàm vẽ fallback khi không có logo
function drawYouthfulFallback(ctx, width, height, lineY, bankName, accountNumber, description) {
    ctx.textAlign = 'center';
    let currentY = lineY + 130;

    // Tên ngân hàng
    ctx.font = 'bold 28px Arial, sans-serif';
    ctx.fillStyle = '#0066FF';
    ctx.fillText(bankName, width / 2, currentY);

    currentY += 60;
    ctx.font = '600 23px Arial, sans-serif';
    ctx.fillStyle = '#374151';
    ctx.fillText('STK: ' + accountNumber, width / 2, currentY);

    // Footer xuống dưới cùng
    ctx.font = '500 14px Arial, sans-serif';
    ctx.fillStyle = '#9ca3af';
    ctx.fillText('Generated via CevinPay', width / 2, height - 55);

    // Nội dung chuyển khoản xuống dưới STK
    if (description && description.trim()) {
        currentY += 30;
        ctx.font = 'italic 18px Arial, sans-serif';
        ctx.fillStyle = '#6b7280';
        ctx.fillText('"' + description + '"', width / 2, currentY);
    }
}

// Hàm vẽ thông tin fallback khi không có logo
function drawFallbackInfo(ctx, width, currentY, bankName, accountNumber, description, height) {
    // Tên ngân hàng
    ctx.font = 'bold 30px Arial, sans-serif';
    ctx.fillStyle = '#1e293b';
    ctx.textAlign = 'center';
    ctx.fillText(bankName, width / 2, currentY);

    // Số tài khoản
    currentY += 60;
    ctx.font = '600 24px Arial, sans-serif';
    ctx.fillStyle = '#334155';
    ctx.fillText('STK: ' + accountNumber, width / 2, currentY);

    // Nội dung
    if (description && description.trim()) {
        currentY += 26;
        ctx.font = 'italic 20px Arial, sans-serif';
        ctx.fillStyle = '#64748b';
        ctx.fillText('"' + description + '"', width / 2, currentY);
    }

    // Footer
    currentY = height - 75;
    ctx.font = '500 16px Arial, sans-serif';
    ctx.fillStyle = '#94a3b8';

    ctx.strokeStyle = '#e2e8f0';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(100, currentY - 20);
    ctx.lineTo(width - 100, currentY - 20);
    ctx.stroke();

    ctx.fillText('Admit One · Generated via CevinPay', width / 2, currentY);
}


// Hàm format số tiền với dấu phẩy
function formatMoney(value) {
    // Loại bỏ tất cả ký tự không phải số
    const number = value.replace(/\D/g, '');
    // Thêm dấu phẩy ngăn cách hàng nghìn
    return number.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
}

// Hàm loại bỏ dấu phẩy để lấy số thuần
function parseMoney(value) {
    return value.replace(/,/g, '');
}

function getSelectedBankMeta() {
    const bankSelect = document.getElementById('bankCode');
    const bankId = bankSelect.value;
    const bankMeta = BANK_META_BY_BIN[bankId] || {};
    const bankDisplay = bankMeta.shortName && bankMeta.name
        ? `${bankMeta.shortName} - ${bankMeta.name}`
        : bankMeta.shortName || bankMeta.name || '';

    return {
        bankBin: bankId,
        bankCode: bankMeta.code || '',
        bankShortName: bankMeta.shortName || '',
        bankDisplay
    };
}

function buildVietQrDeeplink(payload) {
    const bankCodeRaw = payload.bankCode || payload.bankShortName || payload.bankBin || '';
    const bankCode = bankCodeRaw ? String(bankCodeRaw).toLowerCase() : '';
    if (!payload.accountNumber || !bankCode) {
        return null;
    }

    const params = new URLSearchParams();
    params.set('app', bankCode);
    params.set('ba', `${payload.accountNumber}@${bankCode}`);

    if (payload.amount) {
        params.set('am', String(payload.amount));
    }
    if (payload.description) {
        params.set('tn', String(payload.description));
    }

    return `https://dl.vietqr.io/pay?${params.toString()}`;
}

async function copyToClipboard(text) {
    try {
        await navigator.clipboard.writeText(text);
        return true;
    } catch (error) {
        return false;
    }
}

function setSelectedBank(bankId) {
    const bankSelect = document.getElementById('bankCode');
    const bankSelectText = document.getElementById('bankSelectText');
    const bankMeta = BANK_META_BY_BIN[bankId] || {};
    const displayText = bankMeta.shortName && bankMeta.name
        ? `${bankMeta.shortName} - ${bankMeta.name}`
        : bankMeta.shortName || bankMeta.name || '-- Chọn ngân hàng --';

    bankSelect.value = bankId;
    bankSelectText.textContent = displayText;

    bankOptionsCache.forEach((option) => {
        option.classList.toggle('is-active', option.dataset.bankId === bankId);
    });
}

function filterBankOptions(keyword) {
    const needle = String(keyword || '').trim().toLowerCase();
    bankOptionsCache.forEach((option) => {
        const label = String(option.dataset.label || '').toLowerCase();
        option.style.display = label.includes(needle) ? '' : 'none';
    });
}

function setupBankDropdown() {
    const bankSelect = document.getElementById('bankSelect');
    const bankSelectTrigger = document.getElementById('bankSelectTrigger');
    const bankSelectPanel = document.getElementById('bankSelectPanel');
    const bankSearch = document.getElementById('bankSearch');
    const bankOptions = document.getElementById('bankOptions');

    bankSelectTrigger.addEventListener('click', () => {
        bankSelect.classList.toggle('open');
        if (bankSelect.classList.contains('open')) {
            bankSearch.focus();
        }
    });

    bankSearch.addEventListener('input', (e) => {
        filterBankOptions(e.target.value);
    });

    bankSearch.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
        }
    });

    bankOptions.addEventListener('click', (e) => {
        const option = e.target.closest('.bank-option');
        if (!option) {
            return;
        }

        setSelectedBank(option.dataset.bankId);
        bankSelect.classList.remove('open');
    });

    document.addEventListener('click', (e) => {
        if (!bankSelect.contains(e.target) && bankSelectPanel) {
            bankSelect.classList.remove('open');
        }
    });
}

// Xử lý format số tiền khi người dùng nhập
const amountInput = document.getElementById('amount');
amountInput.addEventListener('input', (e) => {
    const cursorPosition = e.target.selectionStart;
    const oldValue = e.target.value;
    const oldLength = oldValue.length;
    
    // Format giá trị mới
    const formatted = formatMoney(e.target.value);
    e.target.value = formatted;
    
    // Điều chỉnh vị trí con trỏ sau khi format
    const newLength = formatted.length;
    const newPosition = cursorPosition + (newLength - oldLength);
    e.target.setSelectionRange(newPosition, newPosition);
});

// Load dữ liệu đã lưu từ Local Storage
window.addEventListener('DOMContentLoaded', async () => {
    await loadBanks();
    setupBankDropdown();

    const savedData = localStorage.getItem('bankAccountInfo');
    if (savedData) {
        const data = JSON.parse(savedData);
        const savedBankCode = String(data.bankCode || '').trim();
        const normalizedCode = savedBankCode.toUpperCase();

        if (savedBankCode && !BANK_NAMES[savedBankCode] && BANK_IDS_BY_CODE[normalizedCode]) {
            setSelectedBank(BANK_IDS_BY_CODE[normalizedCode]);
        } else {
            setSelectedBank(savedBankCode);
        }

        document.getElementById('accountNumber').value = data.accountNumber || '';
    }
});

// Lưu thông tin tài khoản
document.getElementById('saveBtn').addEventListener('click', () => {
    const bankCode = document.getElementById('bankCode').value;
    const accountNumber = document.getElementById('accountNumber').value;

    if (!bankCode || !accountNumber) {
        alert('⚠️ Vui lòng nhập đầy đủ ngân hàng và số tài khoản!');
        return;
    }

    const accountInfo = {
        bankCode,
        accountNumber
    };

    localStorage.setItem('bankAccountInfo', JSON.stringify(accountInfo));
    alert('✅ Đã lưu thông tin tài khoản!');
});

// Xử lý form tạo QR
document.getElementById('qrForm').addEventListener('submit', async (e) => {
    e.preventDefault();

    const bankCode = document.getElementById('bankCode').value;
    const accountNumber = document.getElementById('accountNumber').value;
    const amountFormatted = document.getElementById('amount').value;
    const description = document.getElementById('description').value;

    // Chuyển số tiền đã format về số thuần
    const amount = parseMoney(amountFormatted);

    if (!bankCode || !accountNumber || !amount) {
        alert('⚠️ Vui lòng điền đầy đủ thông tin bắt buộc!');
        return;
    }

    if (parseFloat(amount) < 1000) {
        alert('⚠️ Số tiền phải từ 1,000 VNĐ trở lên!');
        return;
    }

    // Hiển thị loading
    const submitBtn = e.target.querySelector('button[type="submit"]');
    const originalText = submitBtn.textContent;
    submitBtn.textContent = '⏳ Đang tạo...';
    submitBtn.disabled = true;

    try {
        // Gọi API tạo QR
        const params = new URLSearchParams({
            bankCode,
            accountNumber,
            amount,
            description
        });

        const response = await fetch(`/api/generate-qr?${params}`);
        const data = await response.json();

        if (data.success) {
            // Tạo bill QR đẹp mắt
            await createQRBill(data.qrCode, bankCode, accountNumber, amount, description);
            
            // Cập nhật thông tin hiển thị
            document.getElementById('qrImage').src = data.qrCode;
            const bankMeta = getSelectedBankMeta();
            const bankName = BANK_NAMES[bankCode] || bankMeta.bankDisplay || bankCode;
            document.getElementById('displayBank').textContent = bankName;
            document.getElementById('displayAccount').textContent = accountNumber;
            document.getElementById('displayAmount').textContent = parseInt(amount).toLocaleString('vi-VN');
            document.getElementById('displayDescription').textContent = description || '(Không có)';

            lastQrPayload = {
                accountNumber,
                amount,
                description,
                bankBin: bankMeta.bankBin,
                bankCode: bankMeta.bankCode,
                bankShortName: bankMeta.bankShortName
            };

            document.getElementById('qrResult').style.display = 'block';

            // Scroll xuống kết quả
            document.getElementById('qrResult').scrollIntoView({ behavior: 'smooth' });
        } else {
            alert('❌ Lỗi: ' + data.error);
        }
    } catch (error) {
        console.error('Error:', error);
        alert('❌ Có lỗi xảy ra khi tạo mã QR!');
    } finally {
        submitBtn.textContent = originalText;
        submitBtn.disabled = false;
    }
});

// Tải xuống QR code
document.getElementById('downloadBtn').addEventListener('click', () => {
    const canvas = document.getElementById('qrCanvas');
    
    try {
        // Convert canvas to blob
        canvas.toBlob((blob) => {
            const url = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.download = `CevinPay-QR-${Date.now()}.png`;
            link.href = url;
            link.click();
            
            // Cleanup
            window.URL.revokeObjectURL(url);
        }, 'image/png');
    } catch (error) {
        console.error('Download error:', error);
        alert('❌ Lỗi khi tải xuống. Vui lòng thử lại!');
    }
});

// Tạo và sao chép deeplink
document.getElementById('deeplinkBtn').addEventListener('click', async () => {
    if (!lastQrPayload) {
        alert('⚠️ Vui lòng tạo mã QR trước khi lấy deeplink!');
        return;
    }

    const deeplink = buildVietQrDeeplink(lastQrPayload);
    if (!deeplink) {
        alert('❌ Không tạo được deeplink. Vui lòng kiểm tra ngân hàng và số tài khoản.');
        return;
    }

    const copied = await copyToClipboard(deeplink);
    if (copied) {
        alert('✅ Đã sao chép deeplink!');
    } else {
        alert('❌ Không thể sao chép deeplink. Vui lòng thử lại.');
    }
});