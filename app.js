require("dotenv").config()
const express = require("express");
const app = express();
require("./db/conn");
const cors = require("cors");
const port = 4009


app.use(cors());
app.use(express.json());

// admin routes
const adminAuthroutes = require("./routes/admin/adminAuthroutes");
app.use("/adminauth/api",adminAuthroutes);

// productsroutes
const productroutes = require("./routes/products/productroutes");
app.use("/product/api",productroutes);

// user routes
const userAuthroutes = require("./routes/user/userAuthRoutes");
app.use("/userauth/api",userAuthroutes);

// carts routes
const cartsroutes = require("./routes/carts/cartsroutes");
app.use("/carts/api",cartsroutes);

// payment routes
const paymentroutes = require("./routes/payment/PaymentRoutes");
app.use("/checkout/api",paymentroutes);

// order routes
const orderroutes = require("./routes/order/orderRoutes");
app.use("/order/api",orderroutes)

app.get("/",(req,res)=>{
    res.status(200).json("server start");
})

// start server
app.listen(port,()=>{
    console.log(`server start at port no ${port}`)
})