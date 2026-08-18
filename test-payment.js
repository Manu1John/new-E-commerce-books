import mongoose from "mongoose";
import paymentControler from "./controlers/user/paymentControler.js";
import Cart from "./models/Cart.js";
import UserAuthentication from "./models/User.js";
import Order from "./models/Order.js";

async function testOrder() {
  try {
    await mongoose.connect("mongodb://localhost:27017/mydb");
    console.log("Connected to DB");

    // Mock req and res
    const req = {
      session: { user: { _id: "6a7f07b25b62fc7ec0592de4" } }, // Dummy ID
      body: {
        addressId: new mongoose.Types.ObjectId().toString(),
        useWallet: false,
        couponDiscount: 0,
        couponId: null,
        paymentMethod: "COD"
      }
    };

    const res = {
      status: function(s) { 
        console.log("Status:", s); 
        return this; 
      },
      json: function(j) { 
        console.log("JSON:", j); 
        return this; 
      }
    };

    // Need to create a dummy user and cart to test
    const userId = new mongoose.Types.ObjectId();
    req.session.user._id = userId.toString();

    // Create mock product
    const product = await mongoose.connection.collection("products").findOne({});
    let productId;
    if (product) {
      productId = product._id;
    } else {
      const p = await mongoose.connection.collection("products").insertOne({ title: "Test", price: 100 });
      productId = p.insertedId;
    }

    // Create mock cart
    await Cart.create({
      user: userId,
      items: [{
        product: productId,
        quantity: 1
      }]
    });
    
    // We expect it to reach Order.create or crash
    await paymentControler.createOrder(req, res);
    console.log("Test finished");
    process.exit(0);

  } catch (err) {
    console.error("DEBUG FATAL:", err);
    process.exit(1);
  }
}

testOrder();
