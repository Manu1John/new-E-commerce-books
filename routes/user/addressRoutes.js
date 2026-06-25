import express from "express";
import addressControler from "../../controlers/user/addressControler.js";
import { authenticatedUser } from "../../middleware/authMiddleware.js";

const router = express.Router();

router.get(
    "/address",
    authenticatedUser,
    addressControler.getAddressPage
);

router.get(
    "/address/new",
    authenticatedUser,
    addressControler.getAddAddressPage
);

router.post(
    "/address",
    authenticatedUser,
    addressControler.addAddress
);

router.get(
    "/address/:id/edit",
    authenticatedUser,
    addressControler.getEditAddress
);

router.put(
    "/address/:id",
    authenticatedUser,
    addressControler.updateAddress
);

router.delete(
    "/address/:id",
    authenticatedUser,
    addressControler.deleteAddress
);

export default router;