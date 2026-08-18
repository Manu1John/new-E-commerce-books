import express from "express";
import reportControler from "../../controlers/admin/reportControler.js";
import { disableCache, isAuthenticated } from "../../middleware/authMiddleware.js";

const router = express.Router();

router.get("/sales-report", disableCache, isAuthenticated, reportControler.getSalesReport);
router.get("/sales-report/pdf", disableCache, isAuthenticated, reportControler.downloadPDF);
router.get("/sales-report/excel", disableCache, isAuthenticated, reportControler.downloadExcel);

export default router;
