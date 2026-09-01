const https = require('https');

module.exports = async (req, res) => {
  let targetUrl = req.query.url;
  if (!targetUrl || (!targetUrl.startsWith('https://img.vietqr.io/') && !targetUrl.startsWith('https://api.vietqr.io/'))) {
    return res.status(400).send('URL không hợp lệ');
  }

  const fetchWithRedirects = (currentUrl, redirectsLeft = 5) => {
    if (redirectsLeft <= 0) {
      return res.status(500).send('Too many redirects');
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
      res.status(500).send('Proxy Error: ' + err.message);
    });
  };

  fetchWithRedirects(targetUrl);
};
