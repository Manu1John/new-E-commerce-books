import mongoose from 'mongoose';
import User from './models/User.js';
import Wallet from './models/Wallet.js';
import Offer from './models/Offer.js';
import { createVerifiedUserService } from './services/user/otpService.js';

async function run() {
  try {
      await mongoose.connect('mongodb://127.0.0.1:27017/e-commerce');
      console.log('Connected to DB');
      
      const offer = await Offer.findOne({ type: 'referral', isActive: true, isDeleted: false });
      console.log('Active Offer found?', offer ? true : false, offer ? offer.discountPercentage : '');

      // Use unique timestamp-based emails for each test run
      const ts = Date.now();
      const referrerEmail = `referrer_${ts}@example.com`;
      const newUserEmail = `newuser_${ts}@example.com`;

      const referrer = await User.create({
          firstName: 'Ref', lastName: 'Ferrer', email: referrerEmail, password: 'password123', referralCode: `REF${ts}`
      });
      console.log('Referrer created:', referrer.referralCode);

      // Test 1: New user with referral code
      console.log('\n--- Test 1: Signup WITH referral code ---');
      const newUser = await createVerifiedUserService({
          firstName: 'New', lastName: 'User', email: newUserEmail, password: 'password123', referralCode: referrer.referralCode
      });
      const newWallet = await Wallet.findOne({ user: newUser._id });
      const refWallet = await Wallet.findOne({ user: referrer._id });
      
      // Verify wallet linked to user
      const updatedNewUser = await User.findById(newUser._id);
      const updatedReferrer = await User.findById(referrer._id);

      console.log('New User Wallet Balance:', newWallet ? newWallet.balance : 'NULL - BUG!');
      console.log('New User wallet field linked:', updatedNewUser.wallet ? 'YES ✓' : 'NO - BUG!');
      console.log('Referrer Wallet Balance:', refWallet ? refWallet.balance : 'NULL - BUG!');
      console.log('Referrer wallet field linked:', updatedReferrer.wallet ? 'YES ✓' : 'NO - BUG!');
      console.log('Transactions on new user wallet:', newWallet ? newWallet.transactions.map(t => t.description).join(', ') : 'none');

      // Test 2: New user WITHOUT referral code
      console.log('\n--- Test 2: Signup WITHOUT referral code ---');
      const noRefUser = await createVerifiedUserService({
          firstName: 'Plain', lastName: 'User', email: `plain_${ts}@example.com`, password: 'password123'
      });
      const noRefWallet = await Wallet.findOne({ user: noRefUser._id });
      const updatedNoRefUser = await User.findById(noRefUser._id);
      console.log('Plain User Wallet Balance:', noRefWallet ? noRefWallet.balance : 'NULL - BUG!');
      console.log('Plain User wallet field linked:', updatedNoRefUser.wallet ? 'YES ✓' : 'NO - BUG!');

  } catch(e) {
      console.error(e);
  } finally {
      process.exit();
  }
}
run();

