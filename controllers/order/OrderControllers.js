const orderDb = require("../../model/order/OrderModel");
const moment = require("moment");
const userDB = require("../../model/user/userModel");
const { transporter, orderConfirmationTemplate } = require("../../helper");

// add user order -- user
exports.AddOrders = async (req, res) => {
    const { address, city, pincode, mobile, state, country, orderItems, paymentdetails, itemsPrice, shippingPrice, totalPrice } = req.body;

    const deliverydate = moment().add(2, 'days').format('YYYY-MM-DD');

    try {
        const createOrder = new orderDb({
            userid: req.userId, address, city, pincode, mobile, state, country, orderItems, paymentdetails,
            itemsPrice, shippingPrice, totalPrice, deliveredAt: deliverydate
        });

        await createOrder.save();

        res.status(200).json(createOrder)
    } catch (error) {
        res.status(400).json(error);
    }
}

// getUserOrders -- user
exports.getUserOrders = async (req, res) => {
    try {
        const getUserOrders = await orderDb.find({ userid: req.userId }).sort({ _id: -1 });

        res.status(200).json(getUserOrders)
    } catch (error) {
        res.status(400).json(error);
    }
}


// getAllOrders -- admin
exports.getAllOrders = async (req, res) => {
    try {
        const getOrders = await orderDb.find().sort({ _id: -1 });
        res.status(200).json(getOrders)
    } catch (error) {
        res.status(400).json(error);
    }
}

// updateOrderStatus -- admin
exports.updateOrderStatus = async (req, res) => {
    const { orderid } = req.params;
    const { orderStatus } = req.body;

    try {
        const findOrderDetails = await orderDb.findOne({ _id: orderid });


        const userdetails = await userDB.findOne({ _id: findOrderDetails.userid });
        
   
        if (findOrderDetails.orderstatus == "Processing" && orderStatus == "Confirmed") {
            const updateOrder = await orderDb.findByIdAndUpdate({ _id: orderid }, { orderstatus: orderStatus }, { new: true });

            await updateOrder.save();


            // send invoice for order confirmation
            const mailOptions = {
                from:process.env.EMAIL,
                to:userdetails.email,
                subject:"Sending Email For Order Confirmation",
                html:orderConfirmationTemplate(findOrderDetails,userdetails)
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

            res.status(200).json(updateOrder)
        } else if (findOrderDetails.orderstatus == "Confirmed" && orderStatus == "Shipped") {
            const updateOrder = await orderDb.findByIdAndUpdate({ _id: orderid }, { orderstatus: orderStatus }, { new: true });

            await updateOrder.save();

            res.status(200).json(updateOrder)
        }else if(findOrderDetails.orderstatus == "Shipped" && orderStatus == "Delivered"){
            const updateOrder = await orderDb.findByIdAndUpdate({ _id: orderid }, { orderstatus: orderStatus }, { new: true });

            await updateOrder.save();

            res.status(200).json(updateOrder)
        }else{
            res.status(400).json({error:"invalid status"});
        }
    } catch (error) {
        res.status(400).json(error);
    }
}