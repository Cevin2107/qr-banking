const { sseClients } = require('./_db');

module.exports = async (req, res) => {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('Access-Control-Allow-Origin', '*');

  res.write(':\n\n');
  sseClients.add(res);

  req.on('close', () => {
    sseClients.delete(res);
  });
};
