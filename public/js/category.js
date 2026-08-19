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
            event.preventDefault(); // Stop the default form submission
            
            const searchValue = searchInput.value.trim();
            if (searchValue) {
                // Redirect with the query
                window.location.href = `/admin/category?search=${encodeURIComponent(searchValue)}`;
            } else {
                // Clear state if submitted empty
                window.location.href = "/admin/category";
            }
        });
    }

    // --- SweetAlert2 Delete Logic ---
    const deleteButtons = document.querySelectorAll('.delete-category-btn');

    deleteButtons.forEach(button => {
        button.addEventListener('click', async function (e) {
            e.preventDefault();
            
            const categoryId = this.getAttribute('data-id');

            // Replace your custom modal with SweetAlert2
            const result = await Swal.fire({
                title: 'Delete Category?',
                text: "Are you sure you want to delete this category?",
                icon: 'warning',
                showCancelButton: true,
                confirmButtonColor: '#ef4444',
                cancelButtonColor: '#64748b',
                confirmButtonText: 'Yes, delete it!'
            });

            if (result.isConfirmed) {
                try {
                    const response = await fetch(`/admin/category/${categoryId}/delete`, {
                        method: "DELETE",
                        headers: { "Content-Type": "application/json" }
                    });

                    const data = await response.json();

                    if (response.ok && data.success) {
                        await Swal.fire({
                            icon: 'success',
                            title: 'Deleted!',
                            text: 'Category deleted successfully.',
                            showConfirmButton: false,
                            timer: 1500
                        });
                        location.reload();
                    } else {
                        Swal.fire('Error', data.message || "Delete failed", 'error');
                    }
                } catch (err) {
                    console.error("Delete Error:", err);
                    Swal.fire('Server error', 'Could not delete category.', 'error');
                }
            }
        });
    });
});