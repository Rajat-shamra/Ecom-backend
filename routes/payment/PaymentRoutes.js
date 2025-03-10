const express = require("express");
const router = new express.Router();
const userauthenticate = require("../../middleware/user/userauthenticate");
const paymentController = require("../../controllers/payment/paymentControllers");

// paymentroutes
router.post("/payment",userauthenticate,paymentController.processpayment);


module.exports = router;