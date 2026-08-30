// services/categoryService.js
import  Category from '../../models/category.js'


export const getCategoryDashboardService = async(page,limit,search)=>{
    const skip = (page - 1) * limit;
            // Base query
        const query = {
            isDeleted: false
        };

        const filter = {
            name:{
                $regex:search,
                $options:"i"
            },
            isDeleted:false
        }
        const categoryData = await Category.find(filter)
        .sort({createdAt:-1})
        .skip(skip)
        .limit(limit)
        const totalCategory = await Category.countDocuments(filter)
        const totalPages = Math.ceil(totalCategory/limit)
        return {
            totalPages,
            totalCategory,
            categoryData
        }

}

export const addCategoryService = async (categoryData) => {
    const { name, description, status } = categoryData;
    
    // Remove extra spaces
    const categoryName = name.trim().replace(/\s+/g, " ");

    // Escape regex special characters
    const escapedName = categoryName.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

    // Case-insensitive duplicate check
    const existingCategory = await Category.findOne({
        name: {
            $regex: new RegExp(`^${escapedName}$`, "i")
        }
    });

    if (existingCategory) {
        // FIX: Return it as a property of an object
        return { existingCategory }; 
    }

    const newCategory = await Category.create({
        name: categoryName,
        description: description?.trim(),
        status,
    });

    return { newCategory };
}

export const getEditCategoryService = async(categoryId)=>{
    const category = await Category.findById(categoryId)
    return category
}

export const postEditCategoryService = async(categoryId,categoryData)=>{
    const {name,description,status} = categoryData
    const escapedName = name.trim().replace(/\s+/g, " ").replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const existingCategory = await Category.findOne({
        name: { $regex: new RegExp(`^${escapedName}$`, "i") },
        _id: { $ne: categoryId }   // Exclude current category
    });
    if(existingCategory){
        return {existingCategory}
    }
    const updateCategory = await Category.findByIdAndUpdate(categoryId,{
        name:name.trim(),
        description,
        status

    },{returnDocument:'after'})
    return{
        updateCategory
    }
}
export const softDeleteCategoryService = async (categoryId) => {
    // This flips the flag in the database
    const deleteCategory = await Category.findByIdAndUpdate(
        categoryId,
        { isDeleted: true },
        { returnDocument: 'after' }
    );
    return deleteCategory
};
