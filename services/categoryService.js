// services/categoryService.js
import  Category from '../models/category.js'

export const softDelete = async (categoryId) => {
    // This flips the flag in the database
    return await Category.findByIdAndUpdate(
        categoryId,
        { isDeleted: true },
        { new: true }
    );
};

