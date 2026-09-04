import fs from 'fs';
import path from 'path';

const viewsDir = 'f:\\BROTOTYPE\\TechniCal\\MAIN\\E-commerce\\views\\user';

function processFile(filePath) {
    let content = fs.readFileSync(filePath, 'utf-8');
    
    // 1. Remove the if block for wishlist icon
    content = content.replace(/<%\s*if\s*\(\s*product\.status\s*!==\s*'inactive'\s*&&\s*!product\.isDeleted\s*\)\s*{\s*%>\s*([\s\S]*?)<%\s*}\s*%>/g, '$1');

    // 2. Fix image alt text
    content = content.replace(/<%\s*=\s*\(\s*product\.status\s*===\s*'inactive'\s*\|\|\s*product\.isDeleted\s*\)\s*\?\s*'Coming Soon'\s*:\s*product\.title\s*%>/g, '<%= product.title %>');

    // 3. Fix Add to cart button
    const cartRegex = /<%\s*if\s*\(\s*product\.status\s*===\s*'inactive'\s*\|\|\s*product\.isDeleted\s*\)\s*{\s*%>\s*<button.*?disabled.*?>Coming soon<\/button>\s*<%\s*}\s*else\s*{\s*%>\s*([\s\S]*?)<%\s*}\s*%>/g;
    content = content.replace(cartRegex, '$1');

    // 4. Fix title in h3 or h5
    content = content.replace(/<%\s*=\s*\(\s*product\.status\s*===\s*'inactive'\s*\|\|\s*product\.isDeleted\s*\)\s*\?\s*'Coming Soon'\s*:\s*product\.title\s*%>/g, '<%= product.title %>');

    // 5. Fix pricing logic
    const priceRegex = /<%\s*if\s*\(\s*product\.status\s*===\s*'inactive'\s*\|\|\s*product\.isDeleted\s*\)\s*{\s*%>\s*<span.*?class="text-muted".*?>Coming soon<\/span>\s*<%\s*}\s*else\s*if\s*\(\s*(.*?)\s*\)\s*\{\s*%>/g;
    content = content.replace(priceRegex, '<% if ($1) { %>');

    const priceRegex2 = /<%\s*if\s*\(\s*product\.status\s*===\s*'inactive'\s*\|\|\s*product\.isDeleted\s*\)\s*{\s*%>\s*<span.*?class="text-muted".*?>Coming soon<\/span>\s*<%\s*}\s*else\s*if\s*\(\s*(.*?)\s*\)\s*{\s*%>/g;
    content = content.replace(priceRegex2, '<% if ($1) { %>');
    
    // Some lines had a newline in them
    const priceRegex3 = /<%\s*if\s*\(\s*product\.status\s*===\s*'inactive'\s*\|\|\s*product\.isDeleted\s*\)\s*{\s*%>\s*<span.*?class="text-muted".*?>Coming soon<\/span>\s*<%\s*}\s*else\s*if\s*\(\s*(product\.pricing\s*&&\s*product\.pricing\.discountPercentage\s*>\s*0)\s*\)\s*(?:\r?\n)?\s*\{\s*%>/g;
    content = content.replace(priceRegex3, '<% if ($1) { %>');
    
    fs.writeFileSync(filePath, content);
}

const files = fs.readdirSync(viewsDir);
files.forEach(file => {
    if (file.endsWith('.ejs')) {
        const fullPath = path.join(viewsDir, file);
        processFile(fullPath);
        console.log(`Processed ${file}`);
    }
});
