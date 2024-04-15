const express = require('express')
const app = express()
const path = require('path')

// const { registerRoutes } = require('./routes/index.js')
const uploadRoutes = require('./routes/upload')
const cors = require("cors");

// 允许所有来源的跨域请求
app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE');
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
    next();
});

app.use(express.json())
// registerRoutes(app)
app.use('/upload', uploadRoutes)

// 托管静态文件
app.use('/static',express.static(path.join(__dirname,'./public'), {
    maxAge: 1000 * 60 * 60 *24 * 7
}))

app.get('/', (req, res) => {
    res.send('Hello World!')
})

// 跨域
app.use(cors())


const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`服务器正在运行，端口：${PORT}`);
});
