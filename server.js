const http = require('http');
const https = require('https');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

// Tự động đọc file .env ở môi trường local
if (fs.existsSync(path.join(__dirname, '.env'))) {
  const envContent = fs.readFileSync(path.join(__dirname, '.env'), 'utf8');
  envContent.split('\n').forEach(line => {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith('#')) {
      const [key, ...valParts] = trimmed.split('=');
      const val = valParts.join('=').trim();
      if (key && val && !process.env[key.trim()]) {
        process.env[key.trim()] = val.replace(/^["']|["']$/g, '');
      }
    }
  });
}

let PORT = parseInt(process.env.PORT, 10) || 3000;
const SEPAY_SECRET_KEY = process.env.SEPAY_SECRET_KEY || '';

// Bộ nhớ lưu trữ giao dịch chống trùng & lịch sử cho TPBank
const processedTxIds = new Set();
const tpBankTransactions = [];
const sseClients = new Set();

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

function broadcastSseEvent(event, data) {
  const message = `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
  for (const res of sseClients) {
    try {
      res.write(message);
    } catch (e) {
      sseClients.delete(res);
    }
  }
}

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, `http://localhost:${PORT}`);
  
  // Endpoint nhận Webhook từ SePay
  if ((url.pathname === '/api/sepay-webhook' || url.pathname === '/') && req.method === 'POST') {
    let bodyChunks = [];
    req.on('data', chunk => bodyChunks.push(chunk));
    req.on('end', () => {
      const rawBody = Buffer.concat(bodyChunks).toString('utf8');
      const signature = req.headers['x-sepay-signature'] || '';
      const timestamp = req.headers['x-sepay-timestamp'] || '';

      const expectedSignature = 'sha256=' + crypto.createHmac('sha256', SEPAY_SECRET_KEY)
        .update(timestamp + '.' + rawBody)
        .digest('hex');

      if (signature !== expectedSignature) {
        console.warn('⚠️ Webhook SePay chữ ký không hợp lệ!');
        res.writeHead(401, { 'Content-Type': 'text/plain; charset=utf-8' });
        res.end('Invalid signature');
        return;
      }

      let payload = {};
      try {
        payload = JSON.parse(rawBody);
      } catch (e) {
        console.error('❌ Lỗi parse JSON payload SePay');
      }

      const txId = payload.id;
      if (txId && processedTxIds.has(txId)) {
        console.log(`ℹ️ Giao dịch SePay ID ${txId} đã được xử lý trước đó (duplicate)`);
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: true }));
        return;
      }

      if (txId) {
        processedTxIds.add(txId);
      }

      console.log('✅ Webhook SePay hợp lệ:', payload);

      // Kiểm tra xem giao dịch có thuộc về TPBank không
      const gateway = String(payload.gateway || '').toLowerCase();
      const accountNumber = String(payload.accountNumber || '').trim();
      const transferType = String(payload.transferType || 'in').toLowerCase();

      const isTpBank = gateway.includes('tpb') || gateway.includes('tpbank') || accountNumber === '10002150181';

      if (transferType === 'in' && isTpBank) {
        const txRecord = {
          id: payload.id || Date.now(),
          gateway: payload.gateway || 'TPBank',
          transactionDate: payload.transactionDate || new Date().toLocaleString('vi-VN'),
          accountNumber: payload.accountNumber || '10002150181',
          content: payload.content || '',
          description: payload.description || payload.content || '',
          transferAmount: Number(payload.transferAmount || 0),
          referenceCode: payload.referenceCode || '',
          receivedAt: new Date().toISOString()
        };

        // Lưu vào danh sách lịch sử TPBank
        tpBankTransactions.unshift(txRecord);
        if (tpBankTransactions.length > 100) {
          tpBankTransactions.pop();
        }

        // Đẩy sự kiện real-time SSE tới các client
        broadcastSseEvent('tpbank_payment', txRecord);

        // Broadcast tức thì qua kênh Cloud PubSub ntfy
        try {
          if (typeof fetch !== 'undefined') {
            fetch('https://ntfy.sh/cevinpay_sepay_webhook_tpbank_10002150181', {
              method: 'POST',
              headers: { 'Title': 'TPBank Payment' },
              body: JSON.stringify(txRecord)
            }).catch(() => {});
          }
        } catch (e) {}
      }

      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ success: true }));
    });
    return;
  }

  // Endpoint Server-Sent Events (SSE) để client nhận tin nhắn real-time
  if (url.pathname === '/api/events') {
    res.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      'Connection': 'keep-alive',
      'Access-Control-Allow-Origin': '*'
    });
    res.write(':\n\n'); // SSE comment to keep connection alive

    if (req.socket) {
      req.socket.setKeepAlive(true);
      req.socket.setTimeout(0);
    }

    sseClients.add(res);

    const cleanup = () => {
      sseClients.delete(res);
      try { res.end(); } catch (e) {}
    };

    req.on('close', cleanup);
    res.on('close', cleanup);
    return;
  }

  // API lấy lịch sử giao dịch TPBank
  if (url.pathname === '/api/transactions') {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Content-Type', 'application/json');

    let SEPAY_API_KEY = process.env.SEPAY_API_KEY || '';
    if (!SEPAY_API_KEY && fs.existsSync(path.join(__dirname, '.env'))) {
      const envContent = fs.readFileSync(path.join(__dirname, '.env'), 'utf8');
      const match = envContent.match(/SEPAY_API_KEY=(.*)/);
      if (match) SEPAY_API_KEY = match[1].trim().replace(/^["']|["']$/g, '');
    }
    if (SEPAY_API_KEY && typeof fetch !== 'undefined') {
      try {
        const apiRes = await fetch('https://my.sepay.vn/userapi/transactions/list?limit=20', {
          headers: {
            'Authorization': `Bearer ${SEPAY_API_KEY}`,
            'Content-Type': 'application/json'
          }
        });
        if (apiRes.ok) {
          const data = await apiRes.json();
          const list = Array.isArray(data.transactions) ? data.transactions : [];
          const formatted = list
            .filter(item => Number(item.amount_in || 0) > 0)
            .map(item => ({
              id: item.id,
              gateway: item.bank_brand_name || 'TPBank',
              transactionDate: item.transaction_date,
              accountNumber: item.account_number,
              content: item.transaction_content || '',
              description: item.transaction_content || '',
              transferAmount: Number(item.amount_in || 0),
              referenceCode: item.reference_number || '',
              receivedAt: item.transaction_date
            }));

          const existingIds = new Set(formatted.map(t => String(t.id)));
          for (const ramTx of tpBankTransactions) {
            if (!existingIds.has(String(ramTx.id))) {
              formatted.unshift(ramTx);
            }
          }

          res.writeHead(200);
          res.end(JSON.stringify({
            success: true,
            transactions: formatted
          }));
          return;
        }
      } catch (e) {
        console.error('❌ Lỗi gọi SePay API:', e);
      }
    }

    res.writeHead(200);
    res.end(JSON.stringify({
      success: true,
      transactions: tpBankTransactions
    }));
    return;
  }

  // API proxy cho ảnh VietQR (tránh lỗi CORS khi vẽ lên canvas)
  if (url.pathname === '/api/qr-proxy') {
    let targetUrl = url.searchParams.get('url');
    if (!targetUrl || (!targetUrl.startsWith('https://img.vietqr.io/') && !targetUrl.startsWith('https://api.vietqr.io/'))) {
      res.writeHead(400);
      res.end('URL không hợp lệ');
      return;
    }

    const fetchWithRedirects = (currentUrl, redirectsLeft = 5) => {
      if (redirectsLeft <= 0) {
        res.writeHead(500);
        res.end('Too many redirects');
        return;
      }

      https.get(currentUrl, (proxyRes) => {
        if ([301, 302, 307, 308].includes(proxyRes.statusCode) && proxyRes.headers.location) {
          let redir = proxyRes.headers.location;
          if (redir.startsWith('/')) {
            const u = new URL(currentUrl);
            redir = `${u.origin}${redir}`;
          }
          fetchWithRedirects(redir, redirectsLeft - 1);
          return;
        }

        res.writeHead(proxyRes.statusCode, {
          'Content-Type': proxyRes.headers['content-type'] || 'image/png',
          'Access-Control-Allow-Origin': '*',
          'Cache-Control': 'public, max-age=86400'
        });
        proxyRes.pipe(res);
      }).on('error', (err) => {
        console.error('❌ Proxy error:', err);
        res.writeHead(500);
        res.end('Proxy Error: ' + err.message);
      });
    };

    fetchWithRedirects(targetUrl);
    return;
  }

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

function startServer(portToUse) {
  server.listen(portToUse, () => {
    console.log('');
    console.log('🎉 ================================');
    console.log('🚀 Server đang chạy tại:');
    console.log(`   http://localhost:${portToUse}`);
    console.log('🎉 ================================');
    console.log('');
    console.log('📝 Nhấn Ctrl+C để dừng server');
    console.log('');
  });
}

server.on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    console.warn(`⚠️ Cổng ${PORT} đang bị chiếm dụng. Đang tự động thử cổng ${PORT + 1}...`);
    PORT++;
    startServer(PORT);
  } else {
    console.error('❌ Lỗi Server:', err);
  }
});

startServer(PORT);