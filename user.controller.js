const userModel = require(`../models/index`).user

const Op = require(`sequelize`).Op

exports.getAllUser = async (request, response) => {
    let users = await userModel.findAll()
    return response.json({
        success: true,
        data: users,
        message: `All Users have been loaded`
    })
}

//FUNGSI PENCARIAN DATA USER 
exports.findUser = async (request, response) => {
    let keyword = request.body.keyword

    let users = await userModel.findAll({
        where: {
            [Op.or]: [
                {name: { [Op.substring]: keyword} },
                {username: { [Op.substring]: keyword} },
                {password: { [Op.substring]: keyword} },
                {role: { [Op.substring]: keyword} }
            ]
        }
    })
    return response.json({
        success: true,
        data: users,
        message: `All Users have been loaded`
    })
}

//FUNGSI PENAMBAHAN DATA USER BARU 
exports.addUser = (request, response) => {
    let newUser = {
        name: request.body.nama,
        username: request.body.username,
        password: request.body.password,
        role: request.body.role
    }
    userModel.create(newUser)
        .then(result => {
            return response.json({
                success: true,
                data: result,
                message: `Pengguna berhasil ditambahkan` 
            })
        })
        .catch(error => {
            return response.json({
                success: false,
                message: error.message
            })
        })
}

//FUNGSI PENGUBAHAN DATA USER 
exports.updateUser = (request, response) => {
    let dataUser = {
        name: request.body.name,
        username: request.body.username,
        password: request.body.password,
        role: request.body.role
    }
    let idUser = request.params.id

    userModel.update(dataUser, { where: { id: idUser } })
        .then(result => {
            return response.json({
                success: true,
                data:dataUser,
                message: `Pengguna berhasil diubah`
            })
        })
        .catch(error => {
            return response.json({
                success: false,
                message: error.message
            })
        })
}

//FUNGSI DELETE USER
exports.deleteUser = (request, response) => {
    let idUser = request.params.id

    userModel.destroy({ where: { id: idUser } })
        .then(result => {
            return response.json({
                success: true,
                message: `Pengguna berhasil di hapus`
            })
        })
        .catch(error => {
            return response.json ({
                success: false,
                message: error.message
            })
        })
}