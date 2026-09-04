import fs from 'fs';

const filePath = 'services/user/cartService.js';
let content = fs.readFileSync(filePath, 'utf8');

// Chunk 1: getCartService
const target1 = `    if(!cart){
        cart = new Cart({user:userId,items:[]})
        await cart.save()
    }`;
const replace1 = `    if(!cart){
        cart = new Cart({user:userId,items:[]})
        await cart.save()
    }

    // Auto-remove soft-deleted or fully deleted products from the cart
    const initialLength = cart.items.length;
    cart.items = cart.items.filter(item => item.product && !item.product.isDeleted);
    if (cart.items.length !== initialLength) {
        await cart.save();
    }`;

content = content.replace(target1, replace1);

// Chunk 2: calculateCartTotals
const target2 = `const calculateCartTotals = async (userId) => {
  const cart = await Cart.findOne({ user: userId }).populate("items.product");
  const cartCount = cart ? cart.items.reduce((sum, item) => sum + item.quantity, 0) : 0;`;
const replace2 = `const calculateCartTotals = async (userId) => {
  const cart = await Cart.findOne({ user: userId }).populate("items.product");
  
  if (cart) {
    const initialLength = cart.items.length;
    cart.items = cart.items.filter(item => item.product && !item.product.isDeleted);
    if (cart.items.length !== initialLength) {
      await cart.save();
    }
  }

  const cartCount = cart ? cart.items.reduce((sum, item) => sum + item.quantity, 0) : 0;`;

content = content.replace(target2, replace2);

// Chunk 3: getCheckoutDetailsService
const target3 = `  if (!cart || cart.items.length === 0) {
    return { success: false, status: "EMPTY_CART", error: "Your cart is empty. Add products to checkout." };
  }`;
const replace3 = `  if (!cart || cart.items.length === 0) {
    return { success: false, status: "EMPTY_CART", error: "Your cart is empty. Add products to checkout." };
  }

  // Auto-remove soft-deleted or fully deleted products from the cart before checkout
  const initialLength = cart.items.length;
  cart.items = cart.items.filter(item => item.product && !item.product.isDeleted);
  if (cart.items.length !== initialLength) {
      await cart.save();
      if (cart.items.length === 0) {
          return { success: false, status: "EMPTY_CART", error: "Your cart is empty. Add products to checkout." };
      }
  }`;

content = content.replace(target3, replace3);

fs.writeFileSync(filePath, content, 'utf8');
console.log('Successfully updated cartService.js');
