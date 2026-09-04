import fs from 'fs';

const filePath = 'services/user/wishlistService.js';
let content = fs.readFileSync(filePath, 'utf8');

const target1 = `  if (!wishlist) {
    wishlist = new Wishlist({ user: userId, products: [] });
    await wishlist.save();
  }`;

const replace1 = `  if (!wishlist) {
    wishlist = new Wishlist({ user: userId, products: [] });
    await wishlist.save();
  }

  // Auto-remove soft-deleted or fully deleted products from the wishlist DB document
  if (wishlist.products && wishlist.products.length > 0) {
      const initialLength = wishlist.products.length;
      wishlist.products = wishlist.products.filter(p => p && !p.isDeleted);
      if (wishlist.products.length !== initialLength) {
          await wishlist.save();
      }
  }`;

content = content.replace(target1, replace1);

fs.writeFileSync(filePath, content, 'utf8');
console.log('Successfully updated wishlistService.js');
