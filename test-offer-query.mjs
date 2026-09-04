import mongoose from 'mongoose';

mongoose.connect('mongodb://127.0.0.1:27017/mydb').then(async () => {
  const Product = mongoose.model('Product', new mongoose.Schema({ title: String, isDeleted: Boolean, status: String, category: mongoose.Schema.Types.ObjectId }));
  
  const deletedProduct = await Product.findOne({ isDeleted: true });
  if (!deletedProduct) {
    console.log('No deleted products found.');
    process.exit(0);
  }
  console.log('Deleted product ID:', deletedProduct._id);
  
  const docs = await Product.find({ 
    isDeleted: false, 
    $or: [
      { _id: { $in: [deletedProduct._id] } }
    ]
  });
  console.log('Docs found:', docs.length);
  process.exit(0);
});
