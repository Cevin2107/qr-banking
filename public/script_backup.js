// Danh sách tên ngân hàng// Hàm tạo bill QR đẹp mắt phong cách vé xem phim

const BANK_NAMES = {async function createQRBill(qrImageUrl, bankCode, accountNumber, amount, description) {

    'VCB': 'Vietcombank',    const canvas = document.getElementById('qrCanvas');

    'TCB': 'Techcombank',    const ctx = canvas.getContext('2d');

    'CTG': 'VietinBank',    

    'BIDV': 'BIDV',    // Kích thước vé (dọc hơn)

    'ACB': 'ACB',    const width = 550;

    'VPB': 'VPBank',    const height = 1000;

    'TPB': 'TPBank',    canvas.width = width;

    'STB': 'Sacombank',    canvas.height = height;

    'MB': 'MB Bank',

    'AGR': 'Agribank',    // ===== NỀN CHÍNH =====

    'SHB': 'SHB',    const bgGradient = ctx.createLinearGradient(0, 0, 0, height);

    'EIB': 'Eximbank',    bgGradient.addColorStop(0, '#fff8ee');  // be sáng

    'MSB': 'MSB',    bgGradient.addColorStop(1, '#fffdf9');  // kem

    'OCB': 'OCB',    ctx.fillStyle = bgGradient;

    'SEA': 'SeABank'    ctx.fillRect(0, 0, width, height);

};

    // ===== RĂNG CƯA TRÊN – DƯỚI =====

// Logo URLs của các ngân hàng    const semicircleRadius = 15;

const BANK_LOGOS = {    const spacing = 40;

    'VCB': 'https://api.vietqr.io/img/VCB.png',    ctx.fillStyle = '#ffffff';

    'TCB': 'https://api.vietqr.io/img/TCB.png',

    'CTG': 'https://api.vietqr.io/img/CTG.png',    // Trên

    'BIDV': 'https://api.vietqr.io/img/BIDV.png',    for (let x = 0; x < width; x += spacing) {

    'ACB': 'https://api.vietqr.io/img/ACB.png',        ctx.beginPath();

    'VPB': 'https://api.vietqr.io/img/VPB.png',        ctx.arc(x, 0, semicircleRadius, 0, Math.PI);

    'TPB': 'https://api.vietqr.io/img/TPB.png',        ctx.fill();

    'STB': 'https://api.vietqr.io/img/STB.png',    }

    'MB': 'https://api.vietqr.io/img/MB.png',

    'AGR': 'https://api.vietqr.io/img/AGR.png',    // Dưới

    'SHB': 'https://api.vietqr.io/img/SHB.png',    for (let x = 0; x < width; x += spacing) {

    'EIB': 'https://api.vietqr.io/img/EIB.png',        ctx.beginPath();

    'MSB': 'https://api.vietqr.io/img/MSB.png',        ctx.arc(x, height, semicircleRadius, Math.PI, Math.PI * 2);

    'OCB': 'https://api.vietqr.io/img/OCB.png',        ctx.fill();

    'SEA': 'https://api.vietqr.io/img/SEA.png'    }

};

    // ===== NỀN TRẮNG CHÍNH CỦA VÉ =====

// Hàm format số tiền với dấu phẩy    ctx.shadowColor = 'rgba(0, 0, 0, 0.08)';

function formatMoney(value) {    ctx.shadowBlur = 15;

    // Loại bỏ tất cả ký tự không phải số    ctx.shadowOffsetY = 10;

    const number = value.replace(/\D/g, '');    ctx.fillStyle = '#fff';

    // Thêm dấu phẩy ngăn cách hàng nghìn    ctx.beginPath();

    return number.replace(/\B(?=(\d{3})+(?!\d))/g, ',');    ctx.roundRect(30, 30, width - 60, height - 60, 25);

}    ctx.fill();



// Hàm loại bỏ dấu phẩy để lấy số thuần    // Tắt shadow

function parseMoney(value) {    ctx.shadowColor = 'transparent';

    return value.replace(/,/g, '');    ctx.shadowBlur = 0;

}    ctx.shadowOffsetY = 0;



// Hàm tạo bill QR đẹp mắt phong cách vé xem phim    // ===== HEADER “CevinPay” =====

async function createQRBill(qrImageUrl, bankCode, accountNumber, amount, description) {    ctx.textAlign = 'center';

    const canvas = document.getElementById('qrCanvas');    ctx.font = 'bold 64px "Poppins", sans-serif';

    const ctx = canvas.getContext('2d');

        const cevinWidth = ctx.measureText('Cevin').width;

    // Kích thước vé    const centerX = width / 2;

    const width = 550;

    const height = 1000;    // “Cevin” màu cam san hô

    canvas.width = width;    ctx.fillStyle = '#ff7b00';

    canvas.height = height;    ctx.fillText('Cevin', centerX - cevinWidth / 2 - 10, 100);



    // ===== NỀN CHÍNH =====    // “Pay” màu xanh dương

    const bgGradient = ctx.createLinearGradient(0, 0, 0, height);    ctx.fillStyle = '#007bff';

    bgGradient.addColorStop(0, '#fff8ee');    ctx.fillText('Pay', centerX + cevinWidth / 2 + 10, 100);

    bgGradient.addColorStop(1, '#fffdf9');

    ctx.fillStyle = bgGradient;    // ===== ĐƯỜNG TRANG TRÍ DƯỚI HEADER =====

    ctx.fillRect(0, 0, width, height);    const lineGradient = ctx.createLinearGradient(100, 0, width - 100, 0);

    lineGradient.addColorStop(0, '#ff7b00');

    // ===== RĂNG CƯA TRÊN – DƯỚI =====    lineGradient.addColorStop(0.5, '#007bff');

    const semicircleRadius = 15;    lineGradient.addColorStop(1, '#ff7b00');

    const spacing = 40;    ctx.strokeStyle = lineGradient;

    ctx.fillStyle = '#ffffff';    ctx.lineWidth = 3;

    ctx.beginPath();

    // Trên    ctx.moveTo(100, 120);

    for (let x = 0; x < width; x += spacing) {    ctx.lineTo(width - 100, 120);

        ctx.beginPath();    ctx.stroke();

        ctx.arc(x, 0, semicircleRadius, 0, Math.PI);

        ctx.fill();    // ===== LOAD QR CODE =====

    }    const qrImg = new Image();

    qrImg.crossOrigin = 'anonymous';

    // Dưới

    for (let x = 0; x < width; x += spacing) {    return new Promise((resolve) => {

        ctx.beginPath();        qrImg.onload = async () => {

        ctx.arc(x, height, semicircleRadius, Math.PI, Math.PI * 2);            const qrSize = 360;

        ctx.fill();            const qrX = (width - qrSize) / 2;

    }            const qrY = 160;



    // ===== NỀN TRẮNG CHÍNH CỦA VÉ =====            // Viền & bóng QR

    ctx.shadowColor = 'rgba(0, 0, 0, 0.08)';            ctx.shadowColor = 'rgba(0, 0, 0, 0.12)';

    ctx.shadowBlur = 15;            ctx.shadowBlur = 20;

    ctx.shadowOffsetY = 10;            ctx.shadowOffsetY = 5;

    ctx.fillStyle = '#fff';

    ctx.beginPath();            ctx.fillStyle = '#fff';

    ctx.roundRect(30, 30, width - 60, height - 60, 25);            ctx.strokeStyle = '#e0e0e0';

    ctx.fill();            ctx.lineWidth = 2;

            ctx.beginPath();

    // Tắt shadow            ctx.roundRect(qrX - 15, qrY - 15, qrSize + 30, qrSize + 30, 25);

    ctx.shadowColor = 'transparent';            ctx.fill();

    ctx.shadowBlur = 0;            ctx.stroke();

    ctx.shadowOffsetY = 0;

            ctx.shadowColor = 'transparent';

    // ===== HEADER "CevinPay" =====            ctx.shadowBlur = 0;

    ctx.textAlign = 'center';            ctx.drawImage(qrImg, qrX, qrY, qrSize, qrSize);

    ctx.font = 'bold 64px Arial, sans-serif';

            // ===== ĐƯỜNG NGẮT GIỮA =====

    const cevinWidth = ctx.measureText('Cevin').width;            ctx.strokeStyle = '#ccc';

    const centerX = width / 2;            ctx.lineWidth = 2;

            ctx.setLineDash([8, 8]);

    // "Cevin" màu vàng            ctx.beginPath();

    ctx.fillStyle = '#FFB800';            ctx.moveTo(50, qrY + qrSize + 50);

    ctx.fillText('Cevin', centerX - cevinWidth / 2 - 10, 100);            ctx.lineTo(width - 50, qrY + qrSize + 50);

            ctx.stroke();

    // "Pay" màu xanh dương            ctx.setLineDash([]);

    ctx.fillStyle = '#0066FF';

    ctx.fillText('Pay', centerX + cevinWidth / 2 + 10, 100);            // ===== THÔNG TIN DƯỚI QR =====

            let currentY = qrY + qrSize + 100;

    // ===== ĐƯỜNG TRANG TRÍ DƯỚI HEADER =====

    const lineGradient = ctx.createLinearGradient(100, 0, width - 100, 0);            // Số tiền

    lineGradient.addColorStop(0, '#FFB800');            ctx.font = 'bold 54px Arial, sans-serif';

    lineGradient.addColorStop(0.5, '#0066FF');            ctx.fillStyle = '#222';

    lineGradient.addColorStop(1, '#FFB800');            ctx.textAlign = 'center';

    ctx.strokeStyle = lineGradient;            const formattedAmount = parseInt(amount).toLocaleString('vi-VN');

    ctx.lineWidth = 3;            ctx.fillText(formattedAmount + ' VNĐ', width / 2, currentY);

    ctx.beginPath();            currentY += 70;

    ctx.moveTo(100, 120);

    ctx.lineTo(width - 100, 120);            // Logo ngân hàng

    ctx.stroke();            const bankLogoUrl = BANK_LOGOS[bankCode];

            if (bankLogoUrl) {

    // ===== LOAD QR CODE =====                const bankLogo = new Image();

    const qrImg = new Image();                bankLogo.crossOrigin = 'anonymous';

    qrImg.crossOrigin = 'anonymous';

                bankLogo.onload = () => {

    return new Promise((resolve) => {                    const logoSize = 90;

        qrImg.onload = async () => {                    const logoX = (width - logoSize) / 2;

            const qrSize = 360;                    const logoY = currentY;

            const qrX = (width - qrSize) / 2;

            const qrY = 160;                    ctx.shadowColor = 'rgba(0, 0, 0, 0.1)';

                    ctx.shadowBlur = 10;

            // Viền & bóng QR                    ctx.drawImage(bankLogo, logoX, logoY, logoSize, logoSize);

            ctx.shadowColor = 'rgba(0, 0, 0, 0.12)';                    ctx.shadowColor = 'transparent';

            ctx.shadowBlur = 20;                    ctx.shadowBlur = 0;

            ctx.shadowOffsetY = 5;

                    currentY = logoY + logoSize + 35;

            ctx.fillStyle = '#fff';

            ctx.strokeStyle = '#e0e0e0';                    // STK

            ctx.lineWidth = 2;                    ctx.font = '22px Arial, sans-serif';

            ctx.beginPath();                    ctx.fillStyle = '#444';

            ctx.roundRect(qrX - 15, qrY - 15, qrSize + 30, qrSize + 30, 25);                    ctx.fillText('STK: ' + accountNumber, width / 2, currentY);

            ctx.fill();

            ctx.stroke();                    // Nội dung

                    if (description && description.trim()) {

            ctx.shadowColor = 'transparent';                        currentY += 35;

            ctx.shadowBlur = 0;                        ctx.font = 'italic 19px Arial, sans-serif';

            ctx.drawImage(qrImg, qrX, qrY, qrSize, qrSize);                        ctx.fillStyle = '#777';

                        ctx.fillText('"' + description + '"', width / 2, currentY);

            // ===== ĐƯỜNG NGẮT GIỮA =====                    }

            ctx.strokeStyle = '#ccc';

            ctx.lineWidth = 2;                    // Dòng “Admit One” nhỏ cuối vé

            ctx.setLineDash([8, 8]);                    ctx.font = '16px Arial, sans-serif';

            ctx.beginPath();                    ctx.fillStyle = '#999';

            ctx.moveTo(50, qrY + qrSize + 50);                    ctx.fillText('Admit One • Generated via CevinPay', width / 2, height - 30);

            ctx.lineTo(width - 50, qrY + qrSize + 50);

            ctx.stroke();                    resolve();

            ctx.setLineDash([]);                };



            // ===== THÔNG TIN DƯỚI QR =====                bankLogo.onerror = () => {

            let currentY = qrY + qrSize + 100;                    ctx.font = 'bold 24px Arial, sans-serif';

                    ctx.fillStyle = '#333';

            // Số tiền với ngăn cách hàng nghìn                    ctx.fillText(BANK_NAMES[bankCode], width / 2, currentY);

            ctx.font = 'bold 54px Arial, sans-serif';                    currentY += 35;

            ctx.fillStyle = '#222';                    ctx.font = '22px Arial, sans-serif';

            ctx.textAlign = 'center';                    ctx.fillStyle = '#555';

            const formattedAmount = parseInt(amount).toLocaleString('vi-VN');                    ctx.fillText('STK: ' + accountNumber, width / 2, currentY);

            ctx.fillText(formattedAmount + ' VNĐ', width / 2, currentY);                    if (description && description.trim()) {

            currentY += 70;                        currentY += 35;

                        ctx.font = 'italic 19px Arial, sans-serif';

            // Logo ngân hàng                        ctx.fillStyle = '#777';

            const bankLogoUrl = BANK_LOGOS[bankCode];                        ctx.fillText('"' + description + '"', width / 2, currentY);

            if (bankLogoUrl) {                    }

                const bankLogo = new Image();                    ctx.font = '16px Arial, sans-serif';

                bankLogo.crossOrigin = 'anonymous';                    ctx.fillStyle = '#999';

                    ctx.fillText('Admit One • Generated via CevinPay', width / 2, height - 30);

                bankLogo.onload = () => {                    resolve();

                    const logoSize = 90;                };

                    const logoX = (width - logoSize) / 2;

                    const logoY = currentY;                bankLogo.src = bankLogoUrl;

            } else {

                    ctx.shadowColor = 'rgba(0, 0, 0, 0.1)';                ctx.font = 'bold 24px Arial, sans-serif';

                    ctx.shadowBlur = 10;                ctx.fillStyle = '#333';

                    ctx.drawImage(bankLogo, logoX, logoY, logoSize, logoSize);                ctx.fillText(BANK_NAMES[bankCode], width / 2, currentY);

                    ctx.shadowColor = 'transparent';                currentY += 35;

                    ctx.shadowBlur = 0;                ctx.font = '22px Arial, sans-serif';

                ctx.fillStyle = '#555';

                    currentY = logoY + logoSize + 35;                ctx.fillText('STK: ' + accountNumber, width / 2, currentY);

                if (description && description.trim()) {

                    // STK                    currentY += 35;

                    ctx.font = '22px Arial, sans-serif';                    ctx.font = 'italic 19px Arial, sans-serif';

                    ctx.fillStyle = '#444';                    ctx.fillStyle = '#777';

                    ctx.fillText('STK: ' + accountNumber, width / 2, currentY);                    ctx.fillText('"' + description + '"', width / 2, currentY);

                }

                    // Nội dung                ctx.font = '16px Arial, sans-serif';

                    if (description && description.trim()) {                ctx.fillStyle = '#999';

                        currentY += 35;                ctx.fillText('Admit One • Generated via CevinPay', width / 2, height - 30);

                        ctx.font = 'italic 19px Arial, sans-serif';                resolve();

                        ctx.fillStyle = '#777';            }

                        ctx.fillText('"' + description + '"', width / 2, currentY);        };

                    }

        qrImg.onerror = () => {

                    resolve();            console.error('Failed to load QR image');

                };            resolve();

        };

                bankLogo.onerror = () => {

                    ctx.font = 'bold 24px Arial, sans-serif';        qrImg.src = qrImageUrl;

                    ctx.fillStyle = '#333';    });

                    ctx.fillText(BANK_NAMES[bankCode], width / 2, currentY);}

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
