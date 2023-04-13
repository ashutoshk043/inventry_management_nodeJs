const asyncHandler = require('express-async-handler');
const jwt = require('jsonwebtoken');
const User = require('../model/userModel');

const protect = asyncHandler(async (req, res, next)=>{
    try {
        const token = req.cookies.token
        if(!token){
            res.status(401)
            throw new Error("Not Authorized... Please Login")
        }

        const verified = jwt.verify(token, process.env.SECRETE_KEY)
        
        let user = await User.findById(verified.id).select("-password");

        if(!user){
            res.status(401)
            throw new Error("User Not Found..")
        }
        req.user = user
        next()

    } catch (error) {
        res.status(500).send(error.message)
    }
})


module.exports = protect