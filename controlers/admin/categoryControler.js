import Category from "../../models/category.js"
import { softDelete } from '../../services/categoryService.js'
const getCategoryDashboard = async (req, res) => {
    try {

        const page =
            parseInt(req.query.page) || 1;

        const limit = 4;

        const skip =
            (page - 1) * limit;

        const search =
            req.query.search?.trim() || "";

        // Base query
        const query = {
            isDeleted: false
        };

        // Add search only if user typed
        if (search) {
            query.name = {
                $regex: search,
                $options: "i"
            };
        }

        const categoryData =
            await Category.find(query)
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limit);

        const totalCategories =
            await Category.countDocuments(
                query
            );

        const totalPages =
            Math.ceil(
                totalCategories / limit
            );

        return res.render(
            "admin/category",
            {
                title:
                    "category management",

                cssFile:
                    "category.css",

                jsFile:
                    "category.js",

                cat: categoryData,
                currentPage: page,
                totalPages,
                totalCategories,
                search
            }
        );

    } catch (error) {

        console.log(
            "get category dashboard error",
            error
        );

        return res
            .status(500)
            .send(
                "something went wrong"
            );
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

        // Validate category name
        if (!name || !name.trim()) {
            return res.render("admin/addCategory", {
                title: "Category Management",
                cssFile: "addCategory.css",
                jsFile: "addCategory.js",
                error: "Category name is required"
            });
        }

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
            return res.render("admin/addCategory", {
                title: "Category Management",
                cssFile: "addCategory.css",
                jsFile: "addCategory.js",
                error: "Category already exists"
            });
        }

        // Save new category
        const newCategory = new Category({
            name: categoryName,
            description: description?.trim(),
            status
        });

        await newCategory.save();

        return res.redirect("/admin/category");

    } catch (error) {
        console.error("Add Category Error:", error);

        return res.render("admin/addCategory", {
            title: "Category Management",
            cssFile: "addCategory.css",
            jsFile: "addCategory.js",
            error: "Internal server error"
        });
    }
};
const getEditCategory = async (req, res) => {
    try {

        const { id } = req.params;

        const category = await Category.findById(id);

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

        const { id } = req.params;
        const { name, description, status } = req.body;

        // Check duplicate category name
        const existingCategory = await Category.findOne({
            name: name.trim(),
            _id: { $ne: id }
        });

        if (existingCategory) {
            return res.render("admin/editCategory", {
                title: "Edit Category",
                cssFile: "addCategory.css",
                jsFile: "editCategory.js",
                error: "Category already exists",
                category: {
                    _id: id,
                    name,
                    description,
                    status
                }
            });
        }

        await Category.findByIdAndUpdate(id, {
            name: name.trim(),
            description,
            status
        });

        return res.redirect("/admin/category");

    } catch (error) {
        console.log("POST EDIT CATEGORY ERROR:", error);

        return res.status(500).send("Internal server error");
    }
};
const softDeleteCategory = async (req, res) => {
    try {
        const { id } = req.params;

        // FIX: Called the imported function directly instead of using categoryService.softDelete
        const category = await softDelete(id);

        if (!category) {
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

export default{
    getCategoryDashboard,
    getAddCategory,
    addCategory,
    getEditCategory,
    postEditCategory,
    softDeleteCategory
}