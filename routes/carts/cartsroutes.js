const express = require("express");
const router = new express.Router();
const cartsControllers = require("../../controllers/carts/cartsControllers");
const userauthenticate = require("../../middleware/user/userauthenticate");



// carts routes
router.post("/addtocart/:id",userauthenticate,cartsControllers.AddtoCart);
router.get("/getcarts",userauthenticate,cartsControllers.getCartsValue);
router.delete("/removesingleiteam/:id",userauthenticate,cartsControllers.removeSingleiteam);
router.delete("/removeiteams/:id",userauthenticate,cartsControllers.removeAlliteam);


// delete carts data when order done
router.delete("/removecartdata",userauthenticate,cartsControllers.DeleteCartsData);







module.exports = router;