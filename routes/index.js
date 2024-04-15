const uploadRoute = require('./upload')

const registerRoutes = (app) => {
    app.use('/api/upload', uploadRoute)
}

module.exports = {
    registerRoutes
}