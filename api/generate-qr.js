const QRCode = require('qrcode');

// Danh sách mã BIN các ngân hàng Việt Nam
const BANK_BINS = {
  'VCB': '970436',    // Vietcombank
  'TCB': '970407',    // Techcombank
  'CTG': '970422',    // VietinBank
  'BIDV': '970418',   // BIDV
  'ACB': '970416',    // ACB
  'VPB': '970432',    // VPBank
  'TPB': '970423',    // TPBank
  'STB': '970403',    // Sacombank
  'MB': '970422',     // MB Bank
  'AGR': '970405',    // Agribank
  'SHB': '970443',    // SHB
  'EIB': '970431',    // Eximbank
  'MSB': '970426',    // MSB
  'OCB': '970448',    // OCB
  'SEA': '970440',    // SeABank
};

// Hàm tạo chuỗi VietQR theo chuẩn EMVCo
function generateVietQRString(bankCode, accountNumber, amount, description) {
  const bin = BANK_BINS[bankCode] || '970436';
  
  // Format: Payload Format Indicator
  let qrString = '00020101021238';
  
  // VietQR service code
  qrString += '0010A000000727';
  
  // Bank info
  const bankInfo = `0006${bin}01${accountNumber.length.toString().padStart(2, '0')}${accountNumber}`;
  qrString += `01${bankInfo.length.toString().padStart(2, '0')}${bankInfo}`;
  
  // Amount
  if (amount) {
    const amountStr = parseFloat(amount).toFixed(0);
    qrString += `54${amountStr.length.toString().padStart(2, '0')}${amountStr}`;
  }
  
  // Currency (VND)
  qrString += '5303704';
  
  // Country code
  qrString += '5802VN';
  
  // Description
  if (description) {
    const desc = description.substring(0, 25);
    qrString += `62${(desc.length + 4).toString().padStart(2, '0')}08${desc.length.toString().padStart(2, '0')}${desc}`;
  }
  
  // CRC placeholder
  qrString += '6304';
  
  return qrString;
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
    const { bankCode, accountNumber, accountName, amount, description } = req.query;

    if (!bankCode || !accountNumber) {
      return res.status(400).json({ error: 'Thiếu thông tin ngân hàng hoặc số tài khoản' });
    }

    if (!amount || parseFloat(amount) <= 0) {
      return res.status(400).json({ error: 'Số tiền phải lớn hơn 0' });
    }

    // Tạo chuỗi VietQR
    const qrData = generateVietQRString(bankCode, accountNumber, amount, description);

    // Tạo QR code
    const qrCodeDataURL = await QRCode.toDataURL(qrData, {
      width: 400,
      margin: 2,
      color: {
        dark: '#000000',
        light: '#FFFFFF'
      }
    });

    res.status(200).json({ 
      success: true, 
      qrCode: qrCodeDataURL,
      qrData: qrData
    });

  } catch (error) {
    console.error('Error generating QR:', error);
    res.status(500).json({ error: 'Lỗi khi tạo mã QR', details: error.message });
  }
};