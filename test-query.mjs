import mongoose from 'mongoose';

mongoose.connect('mongodb://127.0.0.1:27017/mydb').then(async () => {
  const Product = mongoose.model('Product', new mongoose.Schema({ title: String, author: String, isDeleted: Boolean, status: String, category: mongoose.Schema.Types.ObjectId }));
  const docs = await Product.find({ 
    isDeleted: false, 
    $or: [
      { title: { $regex: 'f', $options: 'i' } }
    ]
  });
  console.log('Docs found:', docs.length);
  const deleted = docs.filter(d => d.isDeleted === true);
  console.log('Deleted found:', deleted.length);
  process.exit(0);
});
