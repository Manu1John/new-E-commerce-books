document.addEventListener("DOMContentLoaded", function() {
    // --- Dynamic Usage Limit Logic ---
    const startDateInput = document.getElementById('startDate');
    const expiryDateInput = document.getElementById('expiryDate');
    const usageLimitInput = document.getElementById('usageLimit');

    function calculateLimit() {
        try {
            if (startDateInput && expiryDateInput && usageLimitInput) {
                if (startDateInput.value && expiryDateInput.value) {
                    const start = new Date(startDateInput.value);
                    const end = new Date(expiryDateInput.value);
                    
                    if (end >= start) {
                        let days = Math.ceil((end - start) / (1000 * 60 * 60 * 24));
                        usageLimitInput.value = days > 0 ? days : 1;
                    } else {
                        usageLimitInput.value = '';
                    }
                }
            }
        } catch (error) {
            console.warn("Date calculation skipped.");
        }
    }

    if (startDateInput && expiryDateInput) {
        startDateInput.addEventListener('change', calculateLimit);
        expiryDateInput.addEventListener('change', calculateLimit);
    }

    // --- Form Submission Logic ---
    const form = document.getElementById('editCouponForm');
    if (form) {
        form.addEventListener('submit', async function(e) {
            // 🚨 CRITICAL: Halts the browser from reloading the page immediately
            e.preventDefault(); 
            
            // Safely extract the ID from the HTML tag
            const couponId = this.getAttribute('data-coupon-id'); 
            const formData = new FormData(this);
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

            // --- Validations ---
            if (!data.code || !data.code.trim()) {
                showError('codeError', 'Coupon Code is required');
            }
            if (!data.discountValue || Number(data.discountValue) < 0) {
                showError('discountValueError', 'Please enter a valid discount value');
            }
            if (!data.discountType) {
                showError('discountTypeError', 'Please select a discount type');
            } else if (data.discountType === 'percentage' && (Number(data.discountValue) <= 0 || Number(data.discountValue) > 99)) {
                showError('discountValueError', 'Percentage discount must be between 1 and 99');
            }
            if (!data.minPurchaseAmount || Number(data.minPurchaseAmount) < 0) {
                showError('minPurchaseAmountError', 'Please enter a valid min purchase amount');
            }
            if (!data.startDate) {
                showError('startDateError', 'Start Date is required');
            }
            if (!data.expiryDate) {
                showError('expiryDateError', 'Expiry Date is required');
            }
            if (data.startDate && data.expiryDate && new Date(data.startDate) > new Date(data.expiryDate)) {
                showError('expiryDateError', 'Expiry Date must be after Start Date');
            }

            if (!isValid) return;

            try {
                // Ensure we use the PUT method as expected by your original backend logic
                const response = await fetch(`/admin/coupons/edit/${couponId}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(data)
                });

                // Safe JSON Parser (Prevents crashes if the backend sends an HTML page instead of JSON)
                const textResponse = await response.text();
                let result;
                try {
                    result = JSON.parse(textResponse);
                } catch (jsonError) {
                    console.error("Backend sent HTML instead of JSON:", textResponse);
                    // If the backend naturally redirected to the coupons list, follow it
                    if (response.url && response.url.includes('/admin/coupons') && !response.url.includes('/edit')) {
                        window.location.href = '/admin/coupons';
                        return;
                    }
                    return Swal.fire('Error', 'The server returned an invalid response.', 'error');
                }
                
                // Process JSON Result
                if (response.ok && result.success) {
                    Swal.fire({ 
                        icon: 'success', 
                        title: 'Updated!', 
                        text: result.message || 'Coupon updated successfully.', 
                        showConfirmButton: false, 
                        timer: 1500 
                    }).then(() => {
                        window.location.href = '/admin/coupons';
                    });
                } else {
                    Swal.fire('Failed', result.message || 'Error occurred while updating.', 'error');
                }
            } catch (err) {
                console.error("Submission error:", err);
                Swal.fire('Network Error', 'Could not reach the server. Please try again.', 'error');
            }
        });
    }
});