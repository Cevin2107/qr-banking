// Tạo QR bằng VietQR Quick Link để dễ chuyển sang deeplink sau này

function normalizeBankId(bankCode) {
  return String(bankCode || '').trim();
}

function buildVietQrPayload({ bankCode, accountNumber, amount, description }) {
  return {
    bankId: normalizeBankId(bankCode),
    accountNo: String(accountNumber || '').trim(),
    amount: String(amount || '').trim(),
    addInfo: String(description || '').trim()
  };
}

function buildVietQrImageUrl(payload, template) {
  const bankId = encodeURIComponent(payload.bankId);
  const accountNo = encodeURIComponent(payload.accountNo);
  const qrTemplate = encodeURIComponent(template || 'qr_only');

  const params = new URLSearchParams();
  if (payload.amount) {
    params.set('amount', payload.amount);
  }
  if (payload.addInfo) {
    params.set('addInfo', payload.addInfo);
  }

  const query = params.toString();
  const suffix = query ? `?${query}` : '';
  return `https://img.vietqr.io/image/${bankId}-${accountNo}-${qrTemplate}.png${suffix}`;
}

function buildVietQrDeeplink(payload) {
  // TODO: sẽ thay bằng deeplink thật theo tài liệu VietQR khi cần
  return null;
}

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

    const payload = buildVietQrPayload({ bankCode, accountNumber, amount, description });
    const qrImageUrl = buildVietQrImageUrl(payload, 'qr_only');
    const deeplink = buildVietQrDeeplink(payload);

    res.status(200).json({ 
      success: true, 
      qrCode: qrImageUrl,
      deeplink
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