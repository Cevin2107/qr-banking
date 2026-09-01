const { sseClients } = require('./_db');

module.exports = async (req, res) => {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache, no-transform');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('Access-Control-Allow-Origin', '*');

  res.write(':\n\n');

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
};
