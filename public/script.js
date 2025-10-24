// Danh sách tên ngân hàng
const BANK_NAMES = {
    'VCB': 'Vietcombank',
    'TCB': 'Techcombank',
    'CTG': 'VietinBank',
    'BIDV': 'BIDV',
    'ACB': 'ACB',
    'VPB': 'VPBank',
    'TPB': 'TPBank',
    'STB': 'Sacombank',
    'MB': 'MB Bank',
    'AGR': 'Agribank',
    'SHB': 'SHB',
    'EIB': 'Eximbank',
    'MSB': 'MSB',
    'OCB': 'OCB',
    'SEA': 'SeABank'
};

// Logo URLs của các ngân hàng
const BANK_LOGOS = {
    'VCB': 'https://api.vietqr.io/img/VCB.png',
    'TCB': 'https://api.vietqr.io/img/TCB.png',
    'CTG': 'https://api.vietqr.io/img/CTG.png',
    'BIDV': 'https://api.vietqr.io/img/BIDV.png',
    'ACB': 'https://api.vietqr.io/img/ACB.png',
    'VPB': 'https://api.vietqr.io/img/VPB.png',
    'TPB': 'https://api.vietqr.io/img/TPB.png',
    'STB': 'https://api.vietqr.io/img/STB.png',
    'MB': 'https://api.vietqr.io/img/MB.png',
    'AGR': 'https://api.vietqr.io/img/AGR.png',
    'SHB': 'https://api.vietqr.io/img/SHB.png',
    'EIB': 'https://api.vietqr.io/img/EIB.png',
    'MSB': 'https://api.vietqr.io/img/MSB.png',
    'OCB': 'https://api.vietqr.io/img/OCB.png',
    'SEA': 'https://api.vietqr.io/img/SEA.png'
};

// Hàm tạo bill QR đẹp mắt
// Hàm tạo bill QR đẹp mắt phong cách vé xem phim
async function createQRBill(qrImageUrl, bankCode, accountNumber, amount, description) {
    const canvas = document.getElementById('qrCanvas');
    const ctx = canvas.getContext('2d');
    
    // Kích thước vé
    const width = 550;
    const height = 920; // Thu gọn từ 1000 xuống 920
    canvas.width = width;
    canvas.height = height;

    // ===== NỀN CHÍNH =====
    const bgGradient = ctx.createLinearGradient(0, 0, 0, height);
    bgGradient.addColorStop(0, '#fff8ee');  // be sáng
    bgGradient.addColorStop(1, '#fffdf9');  // kem
    ctx.fillStyle = bgGradient;
    ctx.fillRect(0, 0, width, height);

    // ===== RĂNG CƯA TRÊN – DƯỚI =====
    const semicircleRadius = 15;
    const spacing = 40;
    ctx.fillStyle = '#ffffff';

    // Trên
    for (let x = 0; x < width; x += spacing) {
        ctx.beginPath();
        ctx.arc(x, 0, semicircleRadius, 0, Math.PI);
        ctx.fill();
    }

    // Dưới
    for (let x = 0; x < width; x += spacing) {
        ctx.beginPath();
        ctx.arc(x, height, semicircleRadius, Math.PI, Math.PI * 2);
        ctx.fill();
    }

    // ===== NỀN TRẮNG CHÍNH CỦA VÉ =====
    ctx.shadowColor = 'rgba(0, 0, 0, 0.08)';
    ctx.shadowBlur = 15;
    ctx.shadowOffsetY = 10;
    ctx.fillStyle = '#fff';
    ctx.beginPath();
    ctx.roundRect(30, 30, width - 60, height - 60, 25);
    ctx.fill();

    // Tắt shadow
    ctx.shadowColor = 'transparent';
    ctx.shadowBlur = 0;
    ctx.shadowOffsetY = 0;

    // ===== HEADER "CevinPay" VIẾT LIỀN =====
    ctx.textAlign = 'center';
    ctx.font = 'bold 64px Arial, sans-serif';

    // Đo chiều rộng tổng
    const totalText = 'CevinPay';
    const cevinText = 'Cevin';
    const payText = 'Pay';
    
    const totalWidth = ctx.measureText(totalText).width;
    const cevinWidth = ctx.measureText(cevinText).width;
    const centerX = width / 2;

    // Vẽ "Cevin" màu vàng
    ctx.fillStyle = '#FFB800';
    ctx.fillText(cevinText, centerX - totalWidth / 2 + cevinWidth / 2, 110);

    // Vẽ "Pay" màu xanh dương ngay sát bên
    const cevinEndX = centerX - totalWidth / 2 + cevinWidth;
    const payWidth = ctx.measureText(payText).width;
    ctx.fillStyle = '#0066FF';
    ctx.fillText(payText, cevinEndX + payWidth / 2, 110);

    // ===== ĐƯỜNG TRANG TRÍ DƯỚI HEADER =====
    const lineGradient = ctx.createLinearGradient(100, 0, width - 100, 0);
    lineGradient.addColorStop(0, '#FFB800');
    lineGradient.addColorStop(0.5, '#0066FF');
    lineGradient.addColorStop(1, '#FFB800');
    ctx.strokeStyle = lineGradient;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(100, 130);
    ctx.lineTo(width - 100, 130);
    ctx.stroke();

    // ===== LOAD QR CODE =====
    const qrImg = new Image();
    qrImg.crossOrigin = 'anonymous';

    return new Promise((resolve) => {
        qrImg.onload = async () => {
            const qrSize = 360;
            const qrX = (width - qrSize) / 2;
            const qrY = 170;

            // Viền & bóng QR
            ctx.shadowColor = 'rgba(0, 0, 0, 0.12)';
            ctx.shadowBlur = 20;
            ctx.shadowOffsetY = 5;

            ctx.fillStyle = '#fff';
            ctx.strokeStyle = '#e0e0e0';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.roundRect(qrX - 15, qrY - 15, qrSize + 30, qrSize + 30, 25);
            ctx.fill();
            ctx.stroke();

            ctx.shadowColor = 'transparent';
            ctx.shadowBlur = 0;
            ctx.drawImage(qrImg, qrX, qrY, qrSize, qrSize);

            // ===== ĐƯỜNG NGẮT GIỮA =====
            ctx.strokeStyle = '#ccc';
            ctx.lineWidth = 2;
            ctx.setLineDash([8, 8]);
            ctx.beginPath();
            ctx.moveTo(50, qrY + qrSize + 50);
            ctx.lineTo(width - 50, qrY + qrSize + 50);
            ctx.stroke();
            ctx.setLineDash([]);

            // ===== THÔNG TIN DƯỚI QR =====
            let currentY = qrY + qrSize + 110;

            // Chữ "Số tiền:" nhỏ ở trên
            ctx.font = '18px Arial, sans-serif';
            ctx.fillStyle = '#888';
            ctx.textAlign = 'center';
            ctx.fillText('Số tiền:', width / 2, currentY);
            
            currentY += 60; // Tăng từ 35 lên 40 để số tiền dịch xuống

            // Số tiền xuống phía dưới
            ctx.font = 'bold 54px Arial, sans-serif';
            ctx.fillStyle = '#222';
            ctx.textAlign = 'center';
            const formattedAmount = parseInt(amount).toLocaleString('vi-VN');
            ctx.fillText(formattedAmount + ' VNĐ', width / 2, currentY);
            currentY += -5; // Giảm từ 70 xuống 50 để logo dịch lên

            // Logo ngân hàng
            const bankLogoUrl = BANK_LOGOS[bankCode];
            if (bankLogoUrl) {
                const bankLogo = new Image();
                bankLogo.crossOrigin = 'anonymous';

                bankLogo.onload = () => {
                    // Tính toán kích thước tự nhiên của logo, giới hạn tối đa gấp 3 lần
                    const maxLogoSize = 300; // Tăng từ 100 lên 300 (gấp 3)
                    const naturalWidth = bankLogo.naturalWidth;
                    const naturalHeight = bankLogo.naturalHeight;
                    
                    // Giữ tỷ lệ, nhưng không vượt quá maxLogoSize
                    let logoWidth = naturalWidth;
                    let logoHeight = naturalHeight;
                    
                    if (naturalWidth > maxLogoSize || naturalHeight > maxLogoSize) {
                        const ratio = Math.min(maxLogoSize / naturalWidth, maxLogoSize / naturalHeight);
                        logoWidth = naturalWidth * ratio;
                        logoHeight = naturalHeight * ratio;
                    }
                    
                    // Căn giữa logo
                    const logoX = (width - logoWidth) / 2;
                    const logoY = currentY;

                    ctx.shadowColor = 'rgba(0, 0, 0, 0.1)';
                    ctx.shadowBlur = 10;
                    ctx.drawImage(bankLogo, logoX, logoY, logoWidth, logoHeight);
                    ctx.shadowColor = 'transparent';
                    ctx.shadowBlur = 0;

                    // STK ngay dưới logo - dịch lên gấp 2
                    currentY = logoY + logoHeight + 10; // Giảm từ 25 xuống 12 (gấp đôi khoảng cách)
                    ctx.font = '22px Arial, sans-serif';
                    ctx.fillStyle = '#444';
                    ctx.fillText('STK: ' + accountNumber, width / 2, currentY);

                    // Nội dung
                    if (description && description.trim()) {
                        currentY += 30;
                        ctx.font = 'italic 19px Arial, sans-serif';
                        ctx.fillStyle = '#777';
                        ctx.fillText('"' + description + '"', width / 2, currentY);
                    }

                    // Dòng "Admit One" nhỏ cuối vé - dịch lên
                    ctx.font = '16px Arial, sans-serif';
                    ctx.fillStyle = '#999';
                    ctx.fillText('Admit One • Generated via CevinPay', width / 2, height - 50);

                    resolve();
                };

                bankLogo.onerror = () => {
                    ctx.font = 'bold 24px Arial, sans-serif';
                    ctx.fillStyle = '#333';
                    ctx.fillText(BANK_NAMES[bankCode], width / 2, currentY);
                    currentY += 35;
                    ctx.font = '22px Arial, sans-serif';
                    ctx.fillStyle = '#555';
                    ctx.fillText('STK: ' + accountNumber, width / 2, currentY);
                    if (description && description.trim()) {
                        currentY += 35;
                        ctx.font = 'italic 19px Arial, sans-serif';
                        ctx.fillStyle = '#777';
                        ctx.fillText('"' + description + '"', width / 2, currentY);
                    }
                    ctx.font = '16px Arial, sans-serif';
                    ctx.fillStyle = '#999';
                    ctx.fillText('Admit One • Generated via CevinPay', width / 2, height - 50);
                    resolve();
                };

                bankLogo.src = bankLogoUrl;
            } else {
                ctx.font = 'bold 24px Arial, sans-serif';
                ctx.fillStyle = '#333';
                ctx.fillText(BANK_NAMES[bankCode], width / 2, currentY);
                currentY += 35;
                ctx.font = '22px Arial, sans-serif';
                ctx.fillStyle = '#555';
                ctx.fillText('STK: ' + accountNumber, width / 2, currentY);
                if (description && description.trim()) {
                    currentY += 35;
                    ctx.font = 'italic 19px Arial, sans-serif';
                    ctx.fillStyle = '#777';
                    ctx.fillText('"' + description + '"', width / 2, currentY);
                }
                ctx.font = '16px Arial, sans-serif';
                ctx.fillStyle = '#999';
                ctx.fillText('Admit One • Generated via CevinPay', width / 2, height - 50);
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
window.addEventListener('DOMContentLoaded', () => {
    const savedData = localStorage.getItem('bankAccountInfo');
    if (savedData) {
        const data = JSON.parse(savedData);
        document.getElementById('bankCode').value = data.bankCode || '';
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
            document.getElementById('displayBank').textContent = BANK_NAMES[bankCode];
            document.getElementById('displayAccount').textContent = accountNumber;
            document.getElementById('displayAmount').textContent = parseInt(amount).toLocaleString('vi-VN');
            document.getElementById('displayDescription').textContent = description || '(Không có)';

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