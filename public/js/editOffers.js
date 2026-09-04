document.addEventListener("DOMContentLoaded", function() {
    const products = window.offerData?.products || [];
    const categories = window.offerData?.categories || [];
    const currentOffer = window.offerData?.currentOffer || null; 

    const offerTypeSelect = document.getElementById('offerType');
    const dynamicSelect = document.getElementById('dynamicSelect');
    const dynamicLabel = document.getElementById('dynamicLabel');
    const offerForm = document.getElementById('offerForm');

    if (!offerTypeSelect || !dynamicSelect || !dynamicLabel) return;

    function updateDropdown() {
        const selectedType = offerTypeSelect.value;
        dynamicSelect.innerHTML = '';

        if (selectedType === 'product') {
            dynamicSelect.parentElement.parentElement.style.display = 'block'; // Show Select Item group
            document.getElementById('discountLabel').innerHTML = 'Discount Percentage <span class="text-danger">*</span>';
            dynamicSelect.name = 'productRef';
            dynamicLabel.innerHTML = 'Select Product Name <span class="required">*</span>';
            dynamicSelect.innerHTML += '<option value="" disabled selected>Select a Product...</option>';
            
            products.forEach(p => {
                const isSelected = (currentOffer && currentOffer.productRef === p._id) ? 'selected' : '';
                dynamicSelect.innerHTML += `<option value="${p._id}" ${isSelected}>${p.title}</option>`;
            });
            
        } else if (selectedType === 'category') {
            dynamicSelect.parentElement.parentElement.style.display = 'block'; // Show Select Item group
            document.getElementById('discountLabel').innerHTML = 'Discount Percentage <span class="text-danger">*</span>';
            dynamicSelect.name = 'categoryRef';
            dynamicLabel.innerHTML = 'Select Category Name <span class="required">*</span>';
            dynamicSelect.innerHTML += '<option value="" disabled selected>Select a Category...</option>';
            
            categories.forEach(c => {
                const isSelected = (currentOffer && currentOffer.categoryRef === c._id) ? 'selected' : '';
                dynamicSelect.innerHTML += `<option value="${c._id}" ${isSelected}>${c.name}</option>`;
            });
        } else if (selectedType === 'referral') {
            dynamicSelect.parentElement.parentElement.style.display = 'none'; // Hide Select Item group
            document.getElementById('discountLabel').innerHTML = 'Bonus Amount (₹) <span class="text-danger">*</span>';
            dynamicSelect.name = '';
            dynamicSelect.innerHTML = '<option value="none" selected>None</option>';
        }
    }

    offerTypeSelect.addEventListener('change', updateDropdown);
    updateDropdown();

    // Form Submission & Validation Logic
    if(offerForm) {
        offerForm.addEventListener('submit', async function(e) {
            e.preventDefault(); 

            const formData = new FormData(offerForm);
            const data = Object.fromEntries(formData.entries());

            // --- Clear previous errors ---
            document.querySelectorAll('.error-msg').forEach(el => el.style.display = 'none');
            let isValid = true;

            const showError = (id, msg) => {
                const el = document.getElementById(id);
                if (el) {
                    el.textContent = msg;
                    el.style.display = 'block';
                }
                isValid = false;
            };

            // Validations
            if (!data.name.trim()) {
                showError('nameError', 'Offer Name is required.');
            }

            const offerType = document.getElementById('offerType').value;
            if (offerType === 'referral') {
                if (!data.discountPercentage || Number(data.discountPercentage) <= 0) {
                    showError('discountPercentageError', 'Bonus amount must be greater than 0.');
                }
            } else {
                if (!data.discountPercentage || Number(data.discountPercentage) <= 0 || Number(data.discountPercentage) >= 100) {
                    showError('discountPercentageError', 'Discount must be between 1% and 99%.');
                }
                const dynamicSelectValue = document.getElementById('dynamicSelect').value;
                if (!dynamicSelectValue || dynamicSelectValue === "") {
                    showError('dynamicSelectError', 'Please select an item.');
                }
            }
            
            if (!data.startDate) {
                showError('startDateError', 'Start Date is required.');
            }
            
            if (!data.expiryDate) {
                showError('expiryDateError', 'Expiry Date is required.');
            } else if (new Date(data.expiryDate) < new Date().setHours(0,0,0,0)) {
                showError('expiryDateError', 'Expiry Date cannot be in the past.');
            }
            
            if (data.startDate && data.expiryDate && new Date(data.startDate) > new Date(data.expiryDate)) {
                showError('expiryDateError', 'Expiry Date must be after the Start Date.');
            }

            if (!isValid) return;

            try {
                // Submit to current edit URL if edit, else to add URL
                const isEdit = window.location.pathname.includes('/edit/');
                const postUrl = isEdit ? window.location.pathname : '/admin/offers/add';
                
                const response = await fetch(postUrl, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(data)
                });

                const result = await response.json();

                if (response.ok && result.success) {
                    Swal.fire({
                        icon: 'success',
                        title: 'Success!',
                        text: result.message,
                        showConfirmButton: false,
                        timer: 4500
                    }).then(() => {
                        window.location.href = '/admin/offers'; 
                    });
                } else {
                    Swal.fire({
                        icon: 'error',
                        title: 'Failed',
                        text: result.message || 'Something went wrong.'
                    });
                }
            } catch (error) {
                console.error("Submission Error:", error);
                Swal.fire('Error', 'A network error occurred. Please try again.', 'error');
            }
        });
    }
});