import mongoose from 'mongoose';
mongoose.connect('mongodb://127.0.0.1:27017/mydb').then(async () => {
  const Product = mongoose.model('Product', new mongoose.Schema({ title: String, isDeleted: Boolean, status: String, category: mongoose.Schema.Types.ObjectId }));
  const docs = await Product.find({ isDeleted: false, status: 'active' });
  console.log('Products that will be SHOWN:');
  docs.forEach(d => console.log('- ' + d.title + ' (id: ' + d._id + ')'));
  process.exit(0);
});
