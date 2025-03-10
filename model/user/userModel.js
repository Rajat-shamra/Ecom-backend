const mongoose = require("mongoose");
const validator = require("validator");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const SECRET_KEY = process.env.USER_SECRET_KEY

// user schema
const userSchema = new mongoose.Schema({
    firstname:{
        type:String,
        required:true
    },
    lastname:{
        type:String,
        required:true
    },
    email: {
        type: String,
        required: true,
        unique: true,
        validate(value) {
            if (!validator.isEmail(value)) {
                throw new Error("not valid email")
            }
        }
    },
    userprofile:{
        type:String,
        required:true
    },
    password:{
        type:String,
        required:true
    },
    tokens: [
        {
            token: {
                type: String,
                required: true
            }
        }
    ],
    // for forgotpassword
    verifytoken:{
        type:String
    }
},{timestamps:true});

// password hashing
userSchema.pre("save",async function(next){
    if(this.isModified("password")){
        this.password = await bcrypt.hash(this.password,12);
    }
    next()
});


// token generate
userSchema.methods.generateuserAuthToken = async function(){
    try {
        let newtoken = jwt.sign({_id:this._id},SECRET_KEY,{
            expiresIn:"1d"
        });

        this.tokens = this.tokens.concat({token:newtoken});

        await this.save()
        return newtoken;
    } catch (error) {
        res.status(400).json({error:error})
    }
}

// user model
const userDB = new mongoose.model("usersDbs",userSchema);

module.exports = userDB;