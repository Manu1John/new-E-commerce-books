
import mongoose from 'mongoose';
import User from './models/User.js';
import Wallet from './models/Wallet.js';
import Offer from './models/Offer.js';
import { createVerifiedUserService } from './services/user/otpService.js';
import crypto from 'crypto';

async function run() {
  try {
      await mongoose.connect('mongodb://127.0.0.1:27017/e-commerce');
      console.log('Connected to DB');
      
      const offer = await Offer.findOne({ type: 'referral', isActive: true, isDeleted: false, startDate: { $lte: new Date() }, expiryDate: { $gt: new Date() } });
      console.log('Active Offer found?', offer ? true : false, offer ? offer.discountPercentage : '');

      let referrer = await User.findOne({ email: 'referrer1@example.com' });
      if (!referrer) {
          referrer = await User.create({
              firstName: 'Ref', lastName: 'Ferrer', email: 'referrer1@example.com', password: 'password123', referralCode: 'TESTREF1'
          });
      }
      console.log('Referrer ready:', referrer.referralCode);

      const userData = {
          firstName: 'New', lastName: 'User', email: 'newuser1@example.com', password: 'password123', referralCode: referrer.referralCode
      };
      
      console.log('Creating verified user...');
      const newUser = await createVerifiedUserService(userData);
      
      const newWallet = await Wallet.findOne({ user: newUser._id });
      const refWallet = await Wallet.findOne({ user: referrer._id });
      
      console.log('New User Wallet Balance:', newWallet ? newWallet.balance : 'null');
      console.log('Referrer Wallet Balance:', refWallet ? refWallet.balance : 'null');

  } catch(e) {
      console.error(e);
  } finally {
      process.exit();
  }
}
run();

