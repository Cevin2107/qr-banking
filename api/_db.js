global.processedTxIds = global.processedTxIds || new Set();
global.tpBankTransactions = global.tpBankTransactions || [];
global.sseClients = global.sseClients || new Set();

module.exports = {
  processedTxIds: global.processedTxIds,
  tpBankTransactions: global.tpBankTransactions,
  sseClients: global.sseClients,
  SEPAY_SECRET_KEY: process.env.SEPAY_SECRET_KEY || ''
};
