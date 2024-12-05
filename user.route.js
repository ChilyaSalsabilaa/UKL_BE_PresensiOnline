const express = require(`express`)
const { authorize } = require (`../controllers/auth.controller`)
const app = express()
app.use(express.json())
const userController = 
require(`D:/SCHOOL'ss/UKAELL/presensi_onlinee/controllers/user.controller`)

let {validateUser} = require(`../middlewares/user-validation`)

app.get("/",  userController.getAllUser)
app.post("/find", userController.findUser)
app.post("/", userController.addUser)
app.put("/:id", userController.updateUser)
app.delete("/:id", userController.deleteUser)
module.exports = app


//app.get("/",[midOne], userController.getAllUser)