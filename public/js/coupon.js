document.addEventListener("DOMContentLoaded", function () {
    // --- Mobile Sidebar Toggle ---
    const sidebarToggle = document.getElementById('sidebarToggle');
    if (sidebarToggle) {
        sidebarToggle.addEventListener('click', function() {
            document.getElementById('sidebar').classList.toggle('active');
        });
    }

    // --- Search Form Submission Logic ---
    const searchForm = document.getElementById("searchForm");
    const searchInput = document.getElementById("searchInput");

    if (searchForm) {
        searchForm.addEventListener("submit", function (event) {
            event.preventDefault(); 
            const searchValue = searchInput.value.trim();
            if (searchValue) {
                window.location.href = `/admin/coupons?search=${encodeURIComponent(searchValue)}`;
            } else {
                window.location.href = "/admin/coupons";
            }
        });
    }

    // --- SweetAlert2 Delete Logic ---
    document.addEventListener('click', async function (e) {
        const button = e.target.closest('.delete-coupon-btn');
        if (!button) return;

        e.preventDefault();
        const couponId = button.getAttribute('data-id');

        Swal.fire({
            title: 'Are you sure?',
            text: "This coupon will be deleted.",
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#ef4444',
            cancelButtonColor: '#64748b',
            confirmButtonText: 'Yes, delete it!'
        }).then(async (result) => {
            if (result.isConfirmed) {
                try {
                    const response = await fetch(`/admin/coupons/${couponId}`, { method: 'DELETE' });
                    const data = await response.json();
                    
                    if (response.ok && data.success) {
                        Swal.fire({ 
                            icon: 'success', 
                            title: 'Deleted!', 
                            text: data.message, 
                            showConfirmButton: false, 
                            timer: 1500 
                        }).then(() => window.location.reload());
                    } else {
                        Swal.fire('Error', data.message, 'error');
                    } // FIXED: This bracket was missing in your original code
                    
                } catch (err) {
                    Swal.fire('Error', 'Network request failed', 'error');
                }
            }
        });
    });
});