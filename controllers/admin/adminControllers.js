const adminDB = require("../../model/admin/adminModel");
const cloudinary = require("../../Cloudinary/cloudinary");
const bcrypt = require("bcryptjs");


// register controller
exports.Register = async(req,res)=>{
    const {name,email,mobile,password,confirmpassword} = req.body
    console.log("Request Body:", req.body);
    console.log("Uploaded File:", req.file);
    
    if(!name || !email || !mobile || !password || !confirmpassword || !req.file){
        res.status(400).json({error:"all fileds are required"})
    }

    const file = req.file?.path;
    
    try {
        const upload = await cloudinary.uploader.upload(file);
        const preuser = await adminDB.findOne({email:email});
        const mobileverification = await adminDB.findOne({mobile:mobile})
       
        if(preuser){
            res.status(400).json({error:"This Admin is Already Exist"})
        }else if(mobileverification){
            res.status(400).json({error:"This Mobile is Already Exist"})
        }else if(password !== confirmpassword){
            res.status(400).json({error:"password and confirm password not match"})
        }else{
            const adminData = new adminDB({
                name,email,mobile,password,profile:upload.secure_url
            });

            console.log("admindata",adminData)

            await adminData.save();
            res.status(200).json(adminData)
        }
    } catch (error) {
        res.status(400).json(error)
    }
}

// exports.Register = async (req, res) => {
//     try {
//         const { name, email, mobile, password, confirmpassword } = req.body;
//         console.log("Request Body:", req.body);
//         console.log("Uploaded File:", req.file);
        
//         if (!name || !email || !mobile || !password || !confirmpassword || !req.file?.path) {
//             return res.status(400).json({ error: "All fields are required" });
//         }

//         const file = req.file?.path;

//         let upload;
//         try {
//             upload = await cloudinary.uploader.upload(file);
//         } catch (err) {
//             return res.status(500).json({ error: "File upload failed", details: err.message });
//         }

//         const preuser = await adminDB.findOne({ email });
//         if (preuser) {
//             return res.status(400).json({ error: "This Admin already exists" });
//         }

//         const mobileverification = await adminDB.findOne({ mobile });
//         if (mobileverification) {
//             return res.status(400).json({ error: "This Mobile is already in use" });
//         }

//         if (password !== confirmpassword) {
//             return res.status(400).json({ error: "Password and Confirm Password do not match" });
//         }

//         const adminData = new adminDB({
//             name,
//             email,
//             mobile,
//             password,
//             profile: upload.secure_url
//         });

//         console.log("Admin Data:", adminData);

//         await adminData.save();
//         return res.status(200).json(adminData);

//     } catch (error) {
//         console.error("Error:", error);
//         return res.status(500).json({ error: "Internal Server Error", details: error.message });
//     }
// };





// login controller
exports.Login = async(req,res)=>{
    const {email,password} = req.body;
    
    if(!email || !password){
        res.status(400).json({error:"all field require"})
    }

    try {
        const adminValid = await adminDB.findOne({email:email});
        if(adminValid){
            const isMatch = await bcrypt.compare(password,adminValid.password);

            if(!isMatch){
                res.status(400).json({error:"Invalid Details"})
            }else{

                // token generate
                const token = await adminValid.generateAuthToken();

                const result = {
                    adminValid,
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

// admin verify controller
exports.AdminVerify = async(req,res)=>{
    try {
        const VerifyAdmin = await adminDB.findOne({_id:req.userId});
        res.status(200).json(VerifyAdmin)
    } catch (error) {
        res.status(400).json({error:"invalid Details"})
    }
}


// admin logout controller
exports.Logout = async(req,res)=>{
    try {
        req.rootUser.tokens = req.rootUser.tokens.filter((currentElement)=>{
            return currentElement.token !== req.token
        });

        req.rootUser.save();
        res.status(200).json({message:"admin Succesfully Logout"})
    } catch (error) {
        res.status(400).json(error)
        
    }
}

// 1   
// 2!== 2 =  1,3,4
// 3
// 4