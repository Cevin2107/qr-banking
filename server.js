const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = 3000;

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

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, `http://localhost:${PORT}`);
  
  console.log(`📥 ${req.method} ${url.pathname}`);
  
  // API endpoint để tạo QR
  if (url.pathname === '/api/generate-qr') {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Content-Type', 'application/json');
    
    const params = url.searchParams;
    const bankCode = params.get('bankCode');
    const accountNumber = params.get('accountNumber');
    const amount = params.get('amount');
    const description = params.get('description') || '';

    if (!bankCode || !accountNumber || !amount) {
      res.writeHead(400);
      res.end(JSON.stringify({ 
        success: false,
        error: 'Thiếu thông tin bắt buộc' 
      }));
      return;
    }

    if (parseFloat(amount) <= 0) {
      res.writeHead(400);
      res.end(JSON.stringify({ 
        success: false,
        error: 'Số tiền phải lớn hơn 0' 
      }));
      return;
    }

    try {
      const payload = buildVietQrPayload({ bankCode, accountNumber, amount, description });
      const qrImageUrl = buildVietQrImageUrl(payload, 'qr_only');
      const deeplink = buildVietQrDeeplink(payload);
      
      res.writeHead(200);
      res.end(JSON.stringify({ 
        success: true, 
        qrCode: qrImageUrl,
        deeplink
      }));
      console.log('✅ QR Code generated successfully');
    } catch (error) {
      console.error('❌ Error:', error);
      res.writeHead(500);
      res.end(JSON.stringify({ 
        success: false,
        error: 'Lỗi tạo mã QR', 
        details: error.message 
      }));
    }
    return;
  }

  // Serve static files từ thư mục public
  let filePath = path.join(__dirname, 'public', url.pathname === '/' ? 'index.html' : url.pathname);
  const extname = path.extname(filePath);
  
  const contentTypes = {
    '.html': 'text/html',
    '.css': 'text/css',
    '.js': 'text/javascript',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.ico': 'image/x-icon'
  };
  
  const contentType = contentTypes[extname] || 'text/plain';

  fs.readFile(filePath, (err, content) => {
    if (err) {
      if (err.code === 'ENOENT') {
        res.writeHead(404);
        res.end('404 - File Not Found');
      } else {
        res.writeHead(500);
        res.end('500 - Internal Server Error');
      }
    } else {
      res.writeHead(200, { 'Content-Type': contentType });
      res.end(content);
    }
  });
});

server.listen(PORT, () => {
  console.log('');
  console.log('🎉 ================================');
  console.log('🚀 Server đang chạy tại:');
  console.log(`   http://localhost:${PORT}`);
  console.log('🎉 ================================');
  console.log('');
  console.log('📝 Nhấn Ctrl+C để dừng server');
  console.log('');
});