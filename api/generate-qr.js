// Không cần thư viện QRCode nữa vì sẽ dùng API SePay

module.exports = async (req, res) => {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    const { bankCode, accountNumber, amount, description } = req.query;

    if (!bankCode || !accountNumber) {
      return res.status(400).json({ 
        success: false,
        error: 'Thiếu thông tin ngân hàng hoặc số tài khoản' 
      });
    }

    if (!amount || parseFloat(amount) <= 0) {
      return res.status(400).json({ 
        success: false,
        error: 'Số tiền phải lớn hơn 0' 
      });
    }

    // Sử dụng API SePay để tạo QR VietQR
    // Format: https://qr.sepay.vn/img?acc=SO_TAI_KHOAN&bank=NGAN_HANG&amount=SO_TIEN&des=NOI_DUNG
    const params = new URLSearchParams({
      acc: accountNumber,
      bank: bankCode,
      amount: amount,
      template: 'qronly' // Chỉ hiển thị QR code thuần, không có logo/text
    });

    // Thêm description nếu có
    if (description && description.trim()) {
      params.append('des', description.trim());
    }

    const qrImageUrl = `https://qr.sepay.vn/img?${params.toString()}`;

    res.status(200).json({ 
      success: true, 
      qrCode: qrImageUrl
    });

  } catch (error) {
    console.error('Error generating QR:', error);
    res.status(500).json({ 
      success: false,
      error: 'Lỗi khi tạo mã QR', 
      details: error.message 
    });
  }
};