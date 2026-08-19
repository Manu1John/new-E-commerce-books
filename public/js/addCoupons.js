document.addEventListener("DOMContentLoaded", function() {
    // --- Mobile Sidebar Toggle ---
    const sidebarToggle = document.getElementById('sidebarToggle');
    if (sidebarToggle) {
        sidebarToggle.addEventListener('click', function() {
            document.getElementById('sidebar').classList.toggle('active');
        });
    }

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
    const form = document.getElementById('couponForm');
    if (form) {
        form.addEventListener('submit', async function(e) {
            // 🚨 CRITICAL: Halts the browser from reloading the page immediately
            e.preventDefault(); 
            
            const formData = new FormData(this);
            const data = Object.fromEntries(formData.entries());

            // --- Validations ---
            if (!data.code || !data.code.trim()) {
                return Swal.fire('Error', 'Coupon Code is required', 'error');
            }
            if (new Date(data.startDate) > new Date(data.expiryDate)) {
                return Swal.fire('Error', 'Expiry Date must be after Start Date', 'error');
            }
            if (data.discountType === 'percentage' && (Number(data.discountValue) <= 0 || Number(data.discountValue) > 99)) {
                return Swal.fire('Error', 'Percentage discount must be between 1 and 99', 'error');
            }

            try {
                const response = await fetch('/admin/coupons/add', {
                    method: 'POST',
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
                    if (response.url && response.url.includes('/admin/coupons') && !response.url.includes('/add')) {
                        window.location.href = '/admin/coupons';
                        return;
                    }
                    return Swal.fire('Error', 'The server returned an invalid response.', 'error');
                }
                
                // Process JSON Result
                if (response.ok && result.success) {
                    Swal.fire({ 
                        icon: 'success', 
                        title: 'Success!', 
                        text: result.message || 'Coupon added successfully.', 
                        showConfirmButton: false, 
                        timer: 1500 
                    }).then(() => {
                        window.location.href = '/admin/coupons';
                    });
                } else {
                    Swal.fire('Failed', result.message || 'Error occurred while saving.', 'error');
                }
            } catch (err) {
                console.error("Submission error:", err);
                Swal.fire('Network Error', 'Could not reach the server. Please try again.', 'error');
            }
        });
    }
});