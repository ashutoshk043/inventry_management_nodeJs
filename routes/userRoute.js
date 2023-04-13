const express = require('express');
const router = express.Router();
const { registerUser, loginUser, logout, getUser, loggedin, updateUser, changePassword, forgetPassword, resetPassword } = require('../controller/userController');
const protect = require('../middlewares/authMiddleWare');


router.post('/register', registerUser)
router.post('/login', loginUser)
router.get('/logout', logout)
router.get('/getUser',protect, getUser)
router.get('/loggedin',loggedin)
router.patch('/updateUser', protect ,updateUser)
router.patch('/changePassword', protect ,changePassword)
router.post('/forgetPassword',forgetPassword)
router.put('/resetPassword/:resetToken',resetPassword)


module.exports = router