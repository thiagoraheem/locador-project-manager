const express = require('express');

console.log('Starting simple test server...');

const app = express();

// Ultra-simple test route
app.get('/api/test', (req, res) => {
  res.json({ message: 'Simple server is working', timestamp: new Date().toISOString() });
});

// Serve a simple HTML page for root
app.get('/', (req, res) => {
  res.send('<h1>Server is running!</h1><p>Test API: <a href="/api/test">/api/test</a></p>');
});

// Error handling middleware
app.use((err, req, res, next) => {
  const status = err.status || err.statusCode || 500;
  const message = err.message || 'Internal Server Error';
  res.status(status).json({ message });
});

// Start the server
const port = parseInt(process.env.PORT || '5000', 10);
app.listen(port, '0.0.0.0', () => {
  console.log(`Server running on port ${port}`);
});