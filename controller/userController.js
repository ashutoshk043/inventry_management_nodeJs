const asyncHandler = require('express-async-handler');
const User = require('../model/userModel')
const jwt = require('jsonwebtoken')
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const sendEmail = require('../Utils/sendEmail');
const Token = require('../model/tokenModel');
const { use } = require('../routes/userRoute');
//generate JWT Token..

const generateToken = (id)=>{
    return token = jwt.sign({id}, process.env.SECRETE_KEY, {expiresIn : "1d"});
};


const registerUser = asyncHandler(async (req, res)=>{

    let {name, email, password} = req.body

    //Validataion
    if(!name || !email || !password){
        res.status(400)
        throw new Error('plaese fill in all required fields..')
    }
    if(password.length <6){
        res.status(400)
        throw new Error('password length must be gretaer than 6 character')
    }

    let userExists = await User.findOne({email})

    if(userExists){
    res.status(400)
    throw new Error("User already Exists")
    } 


    let createUser = await User.create(req.body)
    //generate JWT TOKEN 

    let token = generateToken(createUser._id)

    res.cookie("token", token, {
        path: '/',
        httpOnly: true,
        expires: new Date(Date.now() + 1000 * 86400), //1 day
        sameSite:"none",
        // secure: true, 
    })


    if(createUser) res.status(201).send({data:createUser, token: token})
    else res.status(400)
    throw new Error('Some Error Found Please register again.')
})


const loginUser = asyncHandler(async (req, res)=>{
    let {email, password} = req.body

    if(!email || !password){
        res.status(400)
        throw new Error("please add email and password...")
    }
    
    let checkUser = await User.findOne({email});

    let token = generateToken(checkUser._id)

    res.cookie("token", token, {
        path: '/',
        httpOnly: true,
        expires: new Date(Date.now() + 1000 * 86400), //1 day
        sameSite:"none",
        // secure: true, 
    })
    
    if(!checkUser){
        res.status(400)
        throw new Error("User Not Found... Please SignUp");
    }
    const passwordIsCorrect = await bcrypt.compare(password, checkUser.password) 

    if(checkUser && passwordIsCorrect){
        res.send({data: checkUser, token:token})
    }else{
        res.status(400)
        throw new Error("Invalid UserName or Password....")
    }
})


const logout = asyncHandler(async (req, res) =>{
    res.cookie("token", "", {
        path: '/',
        httpOnly: true,
        expires: new Date(0), //expires immediately.
        sameSite:"none", 
    })
    res.status(200).send({message:"Successfully logged Out"});
})

const getUser = asyncHandler(async (req, res)=>{
    let findUser = await User.findById(req.user.id)

    let {_id, name, email, photo, phone, bio } = findUser

    if(!findUser){
        res.status(400)
        throw new Error("invalid user data..")
    }

    res.status(200).send({_id:_id, name: name, email:email, photo:photo, phone:phone, bio:bio})
})

const loggedin = asyncHandler(async(req, res) =>{
        let token = req.cookies.token
        if(!token){
            res.send(false)
        }
        const verified = jwt.verify(token, process.env.SECRETE_KEY)
        if(verified){
            return res.send(true)
        }
        return res.send(false)

})


const updateUser = asyncHandler (async (req, res) =>{
    const user = await User.findById(req.user._id)
    // console.log("Upper value is ....",user)
    if(user){
        const { name, email, photo, phone, bio} = user
        user.email = email
        user.name = req.body.name || name
        user.photo = req.body.photo || photo
        user.phone = req.body.phone || phone
        user.bio = req.body.bio || bio

        const updatedUser = await user.save()
        console.log(updatedUser);
        res.status(200).json({
            _id: updatedUser._id,
            name:updatedUser.name,
            email:updatedUser.email,
            photo:updatedUser.photo, 
            phone: updatedUser.phone, 
            bio: updatedUser.bio
        }) 
    }else{
        res.status(401)
        throw new Error("user not found..")
    }
})

const changePassword = asyncHandler (async (req, res) =>{
    
    const user = await User.findById(req.user._id)
    const {oldpassword, password} = req.body

    if(!user){
        res.status(400)
        throw new Error("User Not Found Please SignUp..")
    }
    //validate
    if(!oldpassword || !password){
        res.status(400)
        throw new Error("Please Add Old and New Password..")
    }

    const passwordIsCorrect = await bcrypt.compare(oldpassword, user.password)

    if(user && passwordIsCorrect){
        user.password = password
        await user.save()
        res.status(200).send("Password Changed Successfully..")
    }else{
        res.status(400)
        throw new Error("Old Password Is Incorrect..")
    }

})

const forgetPassword = asyncHandler(async(req, res)=>{

    const {email} = req.body
    const user = await User.findOne({email})

    if(!user){
        res.status(404)
        throw new Error("User Does Not Exists..")
    }

    let findToken = Token.findById({userId:user._id})

    if(findToken){
        await User.deleteOne()
        // console.log("token Deleted")
    }

    //create reset Token

    const resetToken = crypto.randomBytes(32).toString('hex') + user._id

    console.log(resetToken);

    const hashedToken = crypto.createHash("sha256").update(resetToken).digest('hex')

    await new Token({
        userId: user._id,
        token:hashedToken,
        createdAt: Date.now(),
        expiresAt: Date.now() + 30 * (60*1000) // expires in 30 minutes.
    }).save()

    const resetUrl = `${process.env.base_url}/resetpassword/${resetToken}` 

    const message = `
    <h2>Hello ${user.name}</h2>
    <p>Please use this link to reset your password</p>
    <p>This password is valid for 30 minutes..</p>
    <a href=${resetUrl} clicktracking = off>${resetUrl}</a>
    <p>Regards..</p>
    <p>Project Inventry Management By ASHUTOSH KUMAR</p>
    `;
    const subject = "Password Reset Request.."
    const send_to = user.email
    const sent_from = process.env.EMAIL_USER 

    try {
        await sendEmail(subject,message, send_to, sent_from)
        res.status(200).json({success:true, message:`reset link seccessfully send at ${user.email}`})
    } catch (error) {
        res.status(500).send(error.message)
    }

})


const resetPassword = asyncHandler(async (req, res)=>{
    const {password} = req.body
    const {resetToken} = req.params

    const hashedToken = crypto.createHash("sha256").update(resetToken).digest('hex')

    //find token in the DB

    const userToken = await Token.findOne({
        token: hashedToken,
        expiresAt: {$gt:Date.now()}
    })

    if(!userToken){
        res.status(400)
        throw new Error("Invalid Or Expired Token..")
    }

    const user = await User.findOne({_id:userToken.userId})
    user.password = password
    await user.save();
    res.status(200).send({
        message:"Password Change Successfully Please Login.. "
    })
})



module.exports = {registerUser, loginUser,logout, getUser, loggedin, updateUser, changePassword, forgetPassword, resetPassword}