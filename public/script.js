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

// Load dữ liệu đã lưu từ Local Storage
window.addEventListener('DOMContentLoaded', () => {
    const savedData = localStorage.getItem('bankAccountInfo');
    if (savedData) {
        const data = JSON.parse(savedData);
        document.getElementById('bankCode').value = data.bankCode || '';
        document.getElementById('accountNumber').value = data.accountNumber || '';
        document.getElementById('accountName').value = data.accountName || '';
    }
});

// Lưu thông tin tài khoản
document.getElementById('saveBtn').addEventListener('click', () => {
    const bankCode = document.getElementById('bankCode').value;
    const accountNumber = document.getElementById('accountNumber').value;
    const accountName = document.getElementById('accountName').value;

    if (!bankCode || !accountNumber) {
        alert('⚠️ Vui lòng nhập đầy đủ ngân hàng và số tài khoản!');
        return;
    }

    const accountInfo = {
        bankCode,
        accountNumber,
        accountName
    };

    localStorage.setItem('bankAccountInfo', JSON.stringify(accountInfo));
    alert('✅ Đã lưu thông tin tài khoản!');
});

// Xử lý form tạo QR
document.getElementById('qrForm').addEventListener('submit', async (e) => {
    e.preventDefault();

    const bankCode = document.getElementById('bankCode').value;
    const accountNumber = document.getElementById('accountNumber').value;
    const accountName = document.getElementById('accountName').value;
    const amount = document.getElementById('amount').value;
    const description = document.getElementById('description').value;

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
            accountName,
            amount,
            description
        });

        const response = await fetch(`/api/generate-qr?${params}`);
        const data = await response.json();

        if (data.success) {
            // Hiển thị QR code
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
    const qrImage = document.getElementById('qrImage');
    const link = document.createElement('a');
    link.download = `QR-${Date.now()}.png`;
    link.href = qrImage.src;
    link.click();
});