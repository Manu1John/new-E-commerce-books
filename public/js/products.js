document.addEventListener("DOMContentLoaded", function () {

    console.log("Products JS loaded successfully");

    // =====================================================
    // SEARCH & CLEAR LOGIC
    // =====================================================

    const searchForm = document.getElementById("searchForm");
    const searchInput = document.getElementById("searchInput");
    const clearButton = document.getElementById("clearButton");

    // Handle Search Form Submission
    if (searchForm) {
        searchForm.addEventListener("submit", function (event) {
            event.preventDefault(); // Prevent default HTML submission
            
            const searchValue = searchInput.value.trim();
            
            if (searchValue) {
                // Redirect with search query
                window.location.href = `/admin/products?search=${encodeURIComponent(searchValue)}`;
            } else {
                // If empty, just load the default page
                window.location.href = "/admin/products";
            }
        });
    }

    // Handle Clear Button
    if (clearButton) {
        clearButton.addEventListener("click", function (event) {
            event.preventDefault();
            // Instantly clear and redirect to the base products page
            window.location.href = "/admin/products";
        });
    }


    // =====================================================
    // CHECK SWEETALERT
    // =====================================================

    if (typeof Swal === "undefined") {
        console.error("SweetAlert2 is NOT loaded.");
    } else {
        console.log("SweetAlert2 loaded successfully");
    }


    // =====================================================
    // DELETE PRODUCT
    // =====================================================

    const deleteButtons = document.querySelectorAll(".delete-product-btn");

    console.log("Delete buttons found:", deleteButtons.length);

    deleteButtons.forEach(function (button) {

        button.addEventListener("click", async function (event) {

            event.preventDefault();

            console.log("Delete button clicked");

            // =================================================
            // CHECK SWEETALERT
            // =================================================

            if (typeof Swal === "undefined") {
                alert("SweetAlert2 is not loaded. Check your CDN/script.");
                return;
            }

            // =================================================
            // GET PRODUCT ID
            // =================================================

            const productId = button.dataset.id;

            console.log("Product ID:", productId);

            if (!productId) {
                Swal.fire({
                    icon: "error",
                    title: "Error",
                    text: "Product ID is missing."
                });
                return;
            }

            // =================================================
            // CONFIRMATION
            // =================================================

            const result = await Swal.fire({
                title: "Are you sure?",
                text: "Do you want to soft-delete this product? It will be hidden from the storefront.",
                icon: "warning",
                showCancelButton: true,
                confirmButtonColor: "#ef4444",
                cancelButtonColor: "#64748b",
                confirmButtonText: "Yes, delete it!",
                cancelButtonText: "Cancel",
                reverseButtons: true,
                allowOutsideClick: false
            });

            // =================================================
            // CANCEL
            // =================================================

            if (!result.isConfirmed) {
                console.log("Delete cancelled");
                return;
            }

            // =================================================
            // SAVE ORIGINAL BUTTON
            // =================================================

            const originalHTML = button.innerHTML;

            button.disabled = true;
            button.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i>';

            try {

                // =================================================
                // DELETE REQUEST
                // =================================================

                const url = `/admin/product/${productId}/delete`;

                console.log("Sending DELETE request:", url);

                const response = await fetch(url, {
                    method: "DELETE",
                    headers: {
                        "Accept": "application/json"
                    }
                });

                console.log("Response status:", response.status);

                // =================================================
                // GET RESPONSE
                // =================================================

                const contentType = response.headers.get("content-type") || "";
                let data;

                if (contentType.includes("application/json")) {
                    data = await response.json();
                } else {
                    const text = await response.text();
                    console.error("Server returned HTML/text:", text);
                    throw new Error("Server did not return JSON. Check your backend route.");
                }

                console.log("Server response:", data);

                // =================================================
                // SUCCESS
                // =================================================

                if (response.ok) {
                    await Swal.fire({
                        icon: "success",
                        title: data.message || "Product deleted successfully",
                        toast: true,
                        position: "top-end",
                        showConfirmButton: false,
                        timer: 1500,
                        timerProgressBar: true
                    });

                    window.location.href = "/admin/products";
                    return;
                }

                // =================================================
                // SERVER ERROR
                // =================================================

                button.disabled = false;
                button.innerHTML = originalHTML;

                Swal.fire({
                    icon: "error",
                    title: "Failed to delete",
                    text: data.error || data.message || "Unable to delete product.",
                    confirmButtonColor: "#2563eb"
                });

            } catch (error) {

                // =================================================
                // ERROR
                // =================================================

                console.error("DELETE ERROR:", error);

                button.disabled = false;
                button.innerHTML = originalHTML;

                Swal.fire({
                    icon: "error",
                    title: "Error",
                    text: error.message || "Something went wrong while deleting the product.",
                    confirmButtonColor: "#2563eb"
                });
            }
        });
    });
});