import Wallet from "../../models/Wallet.js";
import UserAuthentication from "../../models/User.js";

const walletControler = {
  getWallet: async (req, res) => {
    try {
      const userId = req.session.user || req.user?._id;
      if (!userId) {
        return res.redirect("/login");
      }

      let wallet = await Wallet.findOne({ user: userId });
      
      // Auto-create wallet if it doesn't exist
      if (!wallet) {
        wallet = await Wallet.create({ user: userId, balance: 0, transactions: [] });
        await UserAuthentication.findByIdAndUpdate(userId, { wallet: wallet._id });
      }

      // Sort transactions by date descending
      wallet.transactions.sort((a, b) => b.date - a.date);

      // Render wallet view (EJS file to be created)
      res.render("user/wallet", {
        title: "My Wallet",
        wallet,
        user: req.user
      });
    } catch (error) {
      console.error("Error fetching wallet:", error);
      res.status(500).send("Internal Server Error");
    }
  }
};

export default walletControler;
