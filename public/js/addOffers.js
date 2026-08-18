document.addEventListener("DOMContentLoaded", function() {
    // Retrieve the database arrays injected from the EJS file
    const products = window.offerData?.products || [];
    const categories = window.offerData?.categories || [];

    const offerTypeSelect = document.getElementById('offerType');
    const dynamicSelect = document.getElementById('dynamicSelect');
    const dynamicLabel = document.getElementById('dynamicLabel');

    // Safety check to ensure elements exist before running logic
    if (!offerTypeSelect || !dynamicSelect || !dynamicLabel) return;

    function updateDropdown() {
        const selectedType = offerTypeSelect.value;
        
        // Clear current options
        dynamicSelect.innerHTML = '';

        if (selectedType === 'product') {
            // Change the select 'name' attribute to match the backend expectation
            dynamicSelect.name = 'productRef';
            dynamicLabel.innerHTML = 'Select Product Name <span class="required">*</span>';
            
            // Add default option
            dynamicSelect.innerHTML += '<option value="" disabled selected>Select a Product...</option>';
            
            // Populate Products
            products.forEach(p => {
                dynamicSelect.innerHTML += `<option value="${p._id}">${p.title}</option>`;
            });
            
        } else if (selectedType === 'category') {
            // Change the select 'name' attribute to match the backend expectation
            dynamicSelect.name = 'categoryRef';
            dynamicLabel.innerHTML = 'Select Category Name <span class="required">*</span>';
            
            // Add default option
            dynamicSelect.innerHTML += '<option value="" disabled selected>Select a Category...</option>';
            
            // Populate Categories
            categories.forEach(c => {
                dynamicSelect.innerHTML += `<option value="${c._id}">${c.name}</option>`;
            });
        }
    }

    // Listen for changes
    offerTypeSelect.addEventListener('change', updateDropdown);

    // Run once on load to populate the initial 'Product' state
    updateDropdown();
});