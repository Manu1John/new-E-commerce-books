
import { softDeleteCategoryService,getCategoryDashboardService,
    addCategoryService,getEditCategoryService,
    postEditCategoryService
 } from '../../services/admin/categoryService.js'


const getCategoryDashboard = async (req, res) => {
    try {
        const page = Number(req.query.page) || 1;
        const limit = Number(req.query.limit)||5;
        const search = req.query.search?.trim() || "";
        const {categoryData,totalCategories,totalPages} =
         await getCategoryDashboardService(page,limit,search)
         res.render("admin/category", {
            title: "category management",
            cssFile: "category.css",
            jsFile: "category.js",
            cat: categoryData,
            currentPage: page,
            totalPages,
            totalCategories,
            search,
            limit
        });

    } catch (error) {
        console.log("get category dashboard error", error);
        return res.status(500).send("something went wrong");
    }
};

const getAddCategory = async(req,res)=>{
    try {
        return res.render("admin/addCategory",{
            title:"add category",
            cssFile:"addCategory.css",
            jsFile:"addCategory.js"
        })
    } catch (error) {
       return res.status(400).json({error:"Cant access category page "})
    }
}

const addCategory = async (req, res) => {
    try {
        const { name, description, status } = req.body;
        
        // BEST PRACTICE: Validate inputs BEFORE hitting the database
        if (!name || !name.trim()) {
            return res.render("admin/addCategory", {
                title: "Category Management",
                cssFile: "addCategory.css",
                jsFile: "addCategory.js",
                error: "Category name is required",
                name,             
                description,      
                status            
            });
        }
        // Now that we know we have a name, call the service
        const { newCategory, existingCategory } = await addCategoryService(req.body);
        // This will now correctly trigger if a duplicate is found
        if (existingCategory) {
            return res.render("admin/addCategory", {
                title: "Category Management",
                cssFile: "addCategory.css",
                jsFile: "addCategory.js",
                error: "Category already exists",
                name,             
                description,      
                status            
            });
        }

        // Successfully created
        return res.redirect("/admin/category");

    } catch (error) {
        console.error("Add Category Error:", error);
        
        const { name = '', description = '', status = 'active' } = req.body || {};

        return res.render("admin/addCategory", {
            title: "Category Management",
            cssFile: "addCategory.css",
            jsFile: "addCategory.js",
            error: "Internal server error",
            name,
            description,
            status
        });
    }
};

const getEditCategory = async (req, res) => {
    try {
        const categoryId = req.params.id;
        const category = await getEditCategoryService(categoryId)
        if (!category) {
            return res.status(404).send("Category not found");
        }

        return res.render("admin/editCategory", {
            title: "Edit Category",
            cssFile: "addCategory.css",
            jsFile: "editCategory.js",
            category
        });

    } catch (error) {
        console.log("GET EDIT CATEGORY ERROR:", error);
        return res.status(500).send("Internal server error");
    }
};

const postEditCategory = async (req, res) => {
    try {
        const categoryId  = req.params.id;
        const { name, description, status } = req.body;
        const {existingCategory,updateCategory} = 
        await postEditCategoryService(categoryId,req.body)
        // Check duplicate category name
        if (existingCategory) {
            return res.render("admin/editCategory", {
                title: "Edit Category",
                cssFile: "addCategory.css",
                jsFile: "editCategory.js",
                error: "Category already exists",
                category: {
                    _id:categoryId,
                    name,
                    description,
                    status
                }
            });
        }
        return res.redirect("/admin/category");
    } catch (error) {
        console.log("POST EDIT CATEGORY ERROR:", error);
        return res.status(500).send("Internal server error");
    }
};

const softDeleteCategory = async (req, res) => {
    try {
        const categoryId= req.params.id;
        const deleteCategory = await softDeleteCategoryService(categoryId);

        if (!deleteCategory) {
            return res.status(404).json({
                success: false,
                message: "Category not found"
            });
        }

        return res.status(200).json({
            success: true,
            message: "Deleted successfully"
        });

    } catch (error) {
        console.error("DELETE ERROR:", error);
        return res.status(500).json({
            success: false,
            message: "Server error"
        });
    }
};

export default {
    getCategoryDashboard,
    getAddCategory,
    addCategory,
    getEditCategory,
    postEditCategory,
    softDeleteCategory
}