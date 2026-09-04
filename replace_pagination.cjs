const fs = require('fs');
const path = require('path');

function replacePagination(filePath) {
    let content = fs.readFileSync(filePath, 'utf8');

    // Pattern to match any pagination block
    // We look for <div class="pagination... "> up to the closing </div>
    const pattern = /<div class="pagination[^>]*>[\s\S]*?<\/div>/g;

    content = content.replace(pattern, (match) => {
        let currentPage, totalPages, pageParam, hash = "''", activeTab = "''";
        
        // Extract variables using regex
        if (match.includes('featuredPage')) {
            currentPage = 'featuredPage';
            totalPages = 'featuredTotalPages';
            pageParam = "'page_featured'";
            hash = "'#featured-books'";
        } else if (match.includes('allPage')) {
            currentPage = 'allPage';
            totalPages = 'allTotalPages';
            pageParam = "'page_all'";
            hash = "'#popular-books'";
            activeTab = 'activeTabId';
        } else if (match.includes('item.page')) {
            currentPage = 'item.page';
            totalPages = 'item.totalPages';
            pageParam = "'page_' + item.category._id";
            hash = "'#popular-books'";
            activeTab = "'cat-' + item.category._id";
        } else if (match.includes('offerPage')) {
            currentPage = 'offerPage';
            totalPages = 'offerTotalPages';
            pageParam = "'page_offer'";
            hash = "'#special-offer'";
        } else {
            console.log("Unrecognized pagination block:", match);
            return match; // don't replace if not recognized
        }

        const includeStmt = `<%- include('../partials/pagination', { 
    currentPage: ${currentPage}, 
    totalPages: ${totalPages}, 
    pageParam: ${pageParam}, 
    hash: ${hash},
    activeTab: ${activeTab} 
}) %>`;

        return includeStmt;
    });

    fs.writeFileSync(filePath, content, 'utf8');
}

const viewsPath = path.join(__dirname, 'views', 'user');
const filesToUpdate = ['home.ejs', 'index.ejs'];

filesToUpdate.forEach(file => {
    const fullPath = path.join(viewsPath, file);
    if (fs.existsSync(fullPath)) {
        replacePagination(fullPath);
        console.log(`Updated ${file}`);
    } else {
        console.log(`File not found: ${fullPath}`);
    }
});
