const express = require("express");
const router = express.Router();

//--------- IMPORT CONTROLLER'S
const userController = require("../controllers/userController")
const productController = require("../controllers/productController")


//----------- USER API'S
router.post('/register', userController.createUser)
router.post('/login', userController.login)
router.get('/user/:userId/profile', userController.getUserById)
router.put('/user/:userId/profile', userController.updateUserById)


//----------- PRODUCT API'S
router.post('/products', productController.createProduct)
router.get('/products', productController.getProducts)


//---------- EXPORT ROUTER
module.exports = router;