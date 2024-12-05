const midOne = async (request, response, next) => {
    console.log(`Run Middleware One`)
    next()
}

module.exports = {
    midOne
}

//load function fro simple-middleware
const simpleMiddleware = require(`../middlewares/simple-middleware`)

app.get("/",[midOne], userController.getAllUsers)