
const mongoose = require("mongoose");
const validator = require("validator");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const SECRET_KEY = process.env.USER_SECRET_KEY;

// user schema
const userSchema = new mongoose.Schema({
  firstname: {
    type: String,
    required: false // not required for Google users
  },
  lastname: {
    type: String,
    required: false
  },
  email: {
    type: String,
    required: true,
    unique: true,
    validate(value) {
      if (!validator.isEmail(value)) {
        throw new Error("Invalid email");
      }
    }
  },
  userprofile: {
    type: String,
    required: false // make optional for Google users
  },
  password: {
    type: String,
    required: false // not needed for Google users
  },
  googleId: {
    type: String,
    default: null
  },
  displayName: {
    type: String,
    default: null
  },
  image: {
    type: String,
    default: null
  },
  tokens: [
    {
      token: {
        type: String,
        required: true
      }
    }
  ],
  verifytoken: {
    type: String
  }
}, { timestamps: true });

// hash password if modified
userSchema.pre("save", async function (next) {
  if (this.isModified("password")) {
    this.password = await bcrypt.hash(this.password, 12);
  }
  next();
});

// generate JWT
userSchema.methods.generateuserAuthToken = async function () {
  try {
    let newtoken = jwt.sign({ _id: this._id }, SECRET_KEY, {
      expiresIn: "1d"
    });

    this.tokens = this.tokens.concat({ token: newtoken });
    await this.save();
    return newtoken;
  } catch (error) {
    throw new Error(error);
  }
};

const userDB = mongoose.model("usersDbs", userSchema);
module.exports = userDB;
