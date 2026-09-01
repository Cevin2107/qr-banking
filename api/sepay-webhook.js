const crypto = require('crypto');
const { processedTxIds, tpBankTransactions, sseClients, SEPAY_SECRET_KEY } = require('./_db');

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, X-SePay-Signature, X-SePay-Timestamp');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).send('Method Not Allowed');
  }

  let rawBody = '';
  if (typeof req.body === 'string') {
    rawBody = req.body;
  } else if (req.body && typeof req.body === 'object') {
    rawBody = JSON.stringify(req.body);
  } else {
    let bodyChunks = [];
    for await (const chunk of req) {
      bodyChunks.push(chunk);
    }
    rawBody = Buffer.concat(bodyChunks).toString('utf8');
  }

  const signature = req.headers['x-sepay-signature'] || req.headers['X-SePay-Signature'] || '';
  const timestamp = req.headers['x-sepay-timestamp'] || req.headers['X-SePay-Timestamp'] || '';

  if (SEPAY_SECRET_KEY) {
    const expectedSignature = 'sha256=' + crypto.createHmac('sha256', SEPAY_SECRET_KEY)
      .update(timestamp + '.' + rawBody)
      .digest('hex');

    if (signature && signature !== expectedSignature) {
      console.warn('⚠️ Webhook SePay chữ ký không hợp lệ!');
      return res.status(401).send('Invalid signature');
    }
  }

  let payload = {};
  try {
    payload = typeof req.body === 'object' && req.body !== null ? req.body : JSON.parse(rawBody);
  } catch (e) {
    console.error('❌ Lỗi parse JSON payload SePay:', e);
  }

  const txId = payload.id;
  if (txId && processedTxIds.has(txId)) {
    return res.status(200).json({ success: true });
  }

  if (txId) {
    processedTxIds.add(txId);
  }

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

    tpBankTransactions.unshift(txRecord);
    if (tpBankTransactions.length > 100) {
      tpBankTransactions.pop();
    }

    const message = `event: tpbank_payment\ndata: ${JSON.stringify(txRecord)}\n\n`;
    for (const clientRes of sseClients) {
      try {
        clientRes.write(message);
      } catch (e) {
        sseClients.delete(clientRes);
      }
    }
  }

  return res.status(200).json({ success: true });
};
