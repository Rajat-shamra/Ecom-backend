const cloudinary = require("../../Cloudinary/cloudinary");
const userDB = require("../../model/user/userModel");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const SECRET_KEY = process.env.USER_SECRET_KEY
const path = require("path");
const fs = require("fs");
const ejs = require("ejs");
const {transporter} = require("../../helper");
const usercontactDB = require("../../model/user/userContactModel");

exports.userRegister = async (req, res) => {
    const { firstname, lastname, email, password, confirmpassword } = req.body;

    try {
        // Check for required fields
        if (!firstname || !email || !lastname || !password || !confirmpassword || !req.file) {
            return res.status(400).json({ error: "All fields are required" });
        }

        const file = req.file?.path;
        
        // Upload to Cloudinary inside try-catch to prevent unhandled errors
        let upload;
        try {
            upload = await cloudinary.uploader.upload(file);
        } catch (uploadError) {
            return res.status(500).json({ error: "File upload failed", details: uploadError.message });
        }

        // Check if user already exists
        const preuser = await userDB.findOne({ email: email });
        if (preuser) {
            return res.status(400).json({ error: "This user already exists" });
        }

        // Check password match
        if (password !== confirmpassword) {
            return res.status(400).json({ error: "Password and confirm password do not match" });
        }

        // Create new user
        const userData = new userDB({
            firstname,
            lastname,
            email,
            password,
            userprofile: upload.secure_url
        });

        await userData.save();
        return res.status(200).json(userData);

    } catch (error) {
        console.error("Error in user registration:", error);
        return res.status(500).json({ error: "Internal Server Error", details: error.message });
    }
};


// login
exports.login = async (req, res) => {
    const {email,password} = req.body;
    
    if(!email || !password){
        res.status(400).json({error:"all field require"})
    }

    try {
        const userValid = await userDB.findOne({email:email});
        if(userValid){
            const isMatch = await bcrypt.compare(password,userValid.password);

            if(!isMatch){
                res.status(400).json({error:"Invalid Details"})
            }else{

                // token generate
                const token = await userValid.generateuserAuthToken();

                const result = {
                    userValid,
                    token
                }
                res.status(200).json(result)
            }
        }else{
            res.status(400).json({error:"invalid details"})
        }
    } catch (error) {
        res.status(400).json(error)
        
    }
}

// userverify

exports.userverify = async(req,res)=>{
    try {
        const verifyUser = await userDB.findOne({_id:req.userId});
        res.status(200).json(verifyUser)
    } catch (error) {
        res.status(400).json(error)
    }
}

// logout
exports.logout = async(req,res)=>{
    try {
        req.rootUser.tokens = req.rootUser.tokens.filter((currentElement)=>{
            return currentElement.token !== req.token
        });

        req.rootUser.save();
        res.status(200).json({message:"user Succesfully Logout"})
    } catch (error) {
        res.status(400).json(error)
        
    }
}

// forgotpassword
exports.forgotpassword = async(req,res)=>{
    const {email} = req.body;
    
    if(!email){
        res.status(400).json({error:"enter your email"});
    }
    try {

        const userfind = await userDB.findOne({email:email});
     

        if(userfind){
            // token generate for password change
            const token = jwt.sign({_id:userfind._id},SECRET_KEY,{
                expiresIn:"120s"
            });

            const setusertoken = await userDB.findByIdAndUpdate({_id:userfind._id},{verifytoken:token},{new:true});
            
            // join email path
            // const emailTemplatepath = path.join(__dirname,"../../EmailTemplate/Forgottemplate.ejs");
            const emailTemplatepath = path.resolve(__dirname, "..", "..", "EmailTemplate", "Forgottemplate.ejs");
            console.log("Looking for EJS template at:", emailTemplatepath);
            const emailtemplateread = fs.readFileSync(emailTemplatepath,"utf8");

            console.log("sssssssss",__dirname)
            
            // Set token and logo value in ejs file
            const data = {
                passwordresetlink:`https://ecom-frontend-beta-three.vercel.app/resetpassword/${userfind.id}/${setusertoken.verifytoken}`,
                logo:"https://cdn-icons-png.flaticon.com/128/732/732200.png"
            }
            // set dynamic datavalue in ejs
            const renderTemplate = ejs.render(emailtemplateread,data);

            if(setusertoken){
                const mailOptions = {
                    from:process.env.EMAIL,
                    to:email,
                    subject:"Sending Email For password Reset",
                    html:renderTemplate
                }
                transporter.sendMail(mailOptions,(error,info)=>{
                    if(error){
                        console.log("error",error)
                        res.status(400).json({error:"email not send"})
                    }else{
                        console.log("email sent",info.response)
                        res.status(200).json({message:"Email sent Sucessfully"})
                    }
                })
            }
        }else{
            res.status(400).json({error:"this user is not exist"})
        }
        
    } catch (error) {
        res.status(400).json(error)
        console.log("catch block run");
        
    }
}

// forgotpasswordverify
exports.forgotpasswordverify = async(req,res)=>{
    const {id,token} = req.params;

    try {
        const validuser = await userDB.findOne({_id:id,verifytoken:token});

        const verifytoken = jwt.verify(token,SECRET_KEY);

        if(validuser && verifytoken._id){
            res.status(200).json({message:"Valid user"});
        }else{
            res.status(400).json({error:"user not exist"})
        }
    } catch (error) {
        res.status(400).json(error)
    }
}

// resetpassword
exports.resetpassword = async(req,res)=>{
    const {id,token} = req.params;
    const {password} = req.body;
    try {
        const validuser = await userDB.findOne({_id:id,verifytoken:token});

        const verifytoken = jwt.verify(token,SECRET_KEY);

        if(validuser && verifytoken._id){

            const newpassword = await bcrypt.hash(password,12);

            const setnewpassword = await userDB.findByIdAndUpdate({_id:id},{password:newpassword},{new:true})

            await setnewpassword.save();
            res.status(200).json({message:"Password sucessfully updated"});
        }else{
            res.status(400).json({error:"your session time out please generate newlink"})
        }
    } catch (error) {
        res.status(400).json(error)

    }
}

// getAlluser
exports.getAlluser = async(req,res)=>{
    const page = req.query.page || 1;
    const ITEM_PER_PAGE = 4;
    try {

        const skip = (page - 1) * ITEM_PER_PAGE;

        const count = await userDB.countDocuments();

        const pageCount = Math.ceil(count/ITEM_PER_PAGE);

        const usersdata = await userDB.find()
        .limit(ITEM_PER_PAGE)
        .skip(skip)
        .sort({_id:-1});

        res.status(200).json({
            Pagination:{
                count,pageCount
            },
            usersdata
        });
        
    } catch (error) {
        res.status(400).json(error)
    }
}

// userDelete
exports.userDelete = async(req,res)=>{
    const {userid} = req.params;
    try {
        const deleteuser = await userDB.findByIdAndDelete({_id:userid});
        res.status(200).json(deleteuser);
    } catch (error) {
        res.status(400).json(error)
    }
}


// userContact

exports.userContact = async(req,res)=>{
    const {name,email,message} = req.body;

    if(!name || !email || !message){
        res.status(400).json({error:"all fields are required"})
    }

    try {
        const usermessageData = new usercontactDB({
            name,email,message
        });


        await usermessageData.save();
        res.status(200).json(usermessageData)
    } catch (error) {
        res.status(400).json(error)
    }
}