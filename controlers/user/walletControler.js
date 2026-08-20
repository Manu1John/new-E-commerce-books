import Wallet from "../../models/Wallet.js";
import UserAuthentication from "../../models/User.js";

const walletControler = {
  getWallet: async (req, res) => {
    try {
      const userId = req.session?.user?.id || req.session?.user?._id || req.user?._id;
      
      if (!userId) {
        return res.redirect("/login");
      }

      let wallet = await Wallet.findOne({ user: userId });
      
      if (!wallet) {
        wallet = await Wallet.create({ user: userId, balance: 0, transactions: [] });
        await UserAuthentication.findByIdAndUpdate(userId, { wallet: wallet._id });
      }

      wallet.transactions.sort((a, b) => b.date - a.date);

      res.render("user/wallet", {
        title: "My Wallet",
        cssFile: "wallet.css", 
        wallet,
        user: req.session?.user || req.user
      });
    } catch (error) {
      console.error("Error fetching wallet:", error);
      res.status(500).send("Internal Server Error");
    }
  },

  addMoney: async (req, res) => {
    try {
      const userId = req.session?.user?.id || req.session?.user?._id || req.user?._id;
      const amount = parseFloat(req.body.amount);

      if (!amount || amount <= 0) {
        return res.status(400).send("Invalid amount");
      }

      const wallet = await Wallet.findOne({ user: userId });
      
      wallet.balance += amount;
      wallet.transactions.push({
        description: "Added Wallet Funds",
        amount: amount,
        type: "credit",
        date: new Date()
      });

      await wallet.save();
      res.redirect("/wallet");
    } catch (error) {
      console.error("Error adding money:", error);
      res.status(500).send("Internal Server Error");
    }
  },

  withdraw: async (req, res) => {
    try {
      const userId = req.session?.user?.id || req.session?.user?._id || req.user?._id;
      const amount = parseFloat(req.body.amount);

      const wallet = await Wallet.findOne({ user: userId });

      if (!amount || amount <= 0) {
        return res.status(400).send("Invalid amount");
      }

      if (wallet.balance < amount) {
        // In a real app, use connect-flash to send an error message to the frontend
        return res.status(400).send("Insufficient balance"); 
      }

      wallet.balance -= amount;
      wallet.transactions.push({
        description: "Withdrawal",
        amount: amount,
        type: "debit",
        date: new Date()
      });

      await wallet.save();
      res.redirect("/wallet");
    } catch (error) {
      console.error("Error withdrawing money:", error);
      res.status(500).send("Internal Server Error");
    }
  }
};

export default walletControler;