const { tpBankTransactions } = require('./_db');

const fs = require('fs');
const path = require('path');

function getApiKey() {
  if (process.env.SEPAY_API_KEY) return process.env.SEPAY_API_KEY;
  try {
    const envPath = path.join(__dirname, '..', '.env');
    if (fs.existsSync(envPath)) {
      const content = fs.readFileSync(envPath, 'utf8');
      const match = content.match(/SEPAY_API_KEY=(.*)/);
      if (match) return match[1].trim().replace(/^["']|["']$/g, '');
    }
  } catch (e) {}
  return '';
}

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Content-Type', 'application/json');

  const apiKey = getApiKey();
  if (apiKey && typeof fetch !== 'undefined') {
    try {
      const apiRes = await fetch('https://my.sepay.vn/userapi/transactions/list?limit=20', {
        headers: {
          'Authorization': `Bearer ${apiKey}`,
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

        return res.status(200).json({
          success: true,
          transactions: formatted.slice(0, 5)
        });
      }
    } catch (e) {
      console.error('Lỗi gọi SePay API:', e);
    }
  }

  return res.status(200).json({
    success: true,
    transactions: tpBankTransactions
  });
};
