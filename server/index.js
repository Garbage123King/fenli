const express = require('express');
const cors = require('cors');
const path = require('path');
const apiRoutes = require('./routes/api');

const app = express();
const PORT = process.env.PORT || 3001;

// 中间件
app.use(cors());
app.use(express.json());

// API路由
app.use('/api', apiRoutes);

// 静态文件服务（前端）
app.use(express.static(path.join(__dirname, '..', 'client')));

// 所有其他路由返回前端页面
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'client', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`自走棋服务器运行在 http://localhost:${PORT}`);
});
