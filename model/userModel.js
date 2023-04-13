const mongoose = require('mongoose')
const bcrypt = require('bcryptjs')

const userSchema = new mongoose.Schema({
    name:{
        type:String,
        required: [true, "please add a name"]
    },
    email:{
        type:String,
        required:[true, "please add an email"],
        unique:true,
        trim:true,
        match: [/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/, "please add valid email."]
    },
    password:{
        type:String,
        required:[true, "Password Required"],
        minLength:[6, "Password MinLength Should be more than 5"],
        maxLength:[200, "Password Max Length shoud be 200"]
    },
    photo:{
        type:String,
        required:[true, "please add an image"],
        default: "https://www.pngitem.com/pimgs/m/22-223968_default-profile-picture-circle-hd-png-download.png"
    },
    phone:{
        type:String,
        default:"+91"
    },
    bio:{
        type:String,
        maxLength:[250, "Bio must not be greater than 250 characters"],
        default:'bio'
    }
}, {timestamps:true})

//encrypt Password before saving to DB

userSchema.pre('save', async function(next){

    if(!this.isModified('password')) return next 

    let genSalt = await bcrypt.genSalt(10)
    let hashedPass = await bcrypt.hash(this.password, genSalt)
    this.password = hashedPass
    next()

})



const User = mongoose.model('User', userSchema)
module.exports = User