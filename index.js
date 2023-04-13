const dotenv = require('dotenv').config()
const express = require('express')
const mongoose = require('mongoose')
const multer = require('multer')
const cors = require('cors')
const userRoute = require('./routes/userRoute')
const errorHandler = require('./middlewares/errorMiddleware')
const cookieParser = require('cookie-parser')
const app = express()

app.use(multer().any());
app.use(express.json())
app.use(cookieParser())
app.use(express.urlencoded({extended:false}))


app.use('/api/users', userRoute)

app.get('/', (req, res)=>{

    // console.log('Cookies: ', req.cookies)

    res.send("Home")
    
})



app.use(errorHandler);

const PORT = process.env.PORT || 5000

mongoose.connect(process.env.DB_URL)
.then(()=>{
    console.log("DB Connected Successfully")
    app.listen(PORT, ()=>{
        console.log(`Server is running on port ${PORT}`)
    })
})
.catch((err) => console.log(err));

