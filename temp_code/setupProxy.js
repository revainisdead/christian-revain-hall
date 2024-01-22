const { createProxyMiddleware } = require('http-proxy-middleware');

const proxy = {
    target: 'http://localhost:8008/api',
    changeOrigin: true,
};

module.exports = function(app) {
    app.use(
        createProxyMiddleware(proxy),
    );
};
