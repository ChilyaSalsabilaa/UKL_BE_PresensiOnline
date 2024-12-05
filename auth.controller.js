const md5 = require(`md5`)

const jwt = require(`jsonwebtoken`)

const userModel = require(`../models/index`).user

//FUNGSI AUTHENTICATE
const authenticate = async (request, response) => {
    let dataLogin = {
        username: request.body.username,
        password: request.body.password
    }

    console.log("cek ",dataLogin);
    
    let dataUser = await userModel.findOne({ where: dataLogin   
    })

    if(dataUser) {
        let payload = JSON.stringify(dataUser)

        let secret = `mokleters`

        let token = jwt.sign(payload, secret)

        return response.json({
            success: true,
            //logged: true,
            message: `Login Berhasil`,
            token: token,
            //data: dataUser
        })
    }

    return response.json({
        success: false,
        logged: false,
        message: `Authentication Failed. Invalid username or password`
    })
}

//FUNGSI AUTHORIZATION
const authorize = (request, response, next) => {
    let headers = request.headers.authorization
    let tokenKey = headers && headers.split(" ") [1] 
    
    if (tokenKey == null) {
        return response.json({
            success: false,
            message: `Unauthorized User`
        })
    }

    let secret = `mokleters`

    jwt.verify(tokenKey, secret, (error, user) => {
        if (error) {
            return response.json({
                success: false,
                message: `Invalid token`
            })
        }
    })

    next()
}
module.exports = { authenticate, authorize }