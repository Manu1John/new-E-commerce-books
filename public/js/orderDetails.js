document.addEventListener("DOMContentLoaded", () => {
    // Elements
    const updateStatusBtn = document.getElementById("updateStatusBtn");
    const downloadInvoiceBtn = document.getElementById("downloadInvoiceBtn");
    const printInvoiceBtn = document.getElementById("printInvoiceBtn");
    const issueRefundBtn = document.getElementById("issueRefundBtn");
    const statusDropdown = document.getElementById("orderStatus");

    // ==========================================
    // 1. UPDATE STATUS ACTION
    // ==========================================
    if (updateStatusBtn && statusDropdown) {
        updateStatusBtn.addEventListener("click", async () => {
            const orderId = updateStatusBtn.getAttribute("data-order-id");
            const selectedStatus = statusDropdown.value;

            try {
                const response = await fetch(`/admin/orders/${orderId}/status`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ status: selectedStatus })
                });

                const result = await response.json();
                if (result.success) {
                    Swal.fire({
                        icon: 'success',
                        title: 'Success!',
                        text: result.message,
                        timer: 2000,
                        showConfirmButton: false
                    }).then(() => {
                        window.location.reload();
                    });
                } else {
                    Swal.fire({
                        icon: 'error',
                        title: 'Failed',
                        text: result.error || "Failed to update status"
                    });
                }
            } catch (error) {
                console.error("Error:", error);
                Swal.fire({
                    icon: 'error',
                    title: 'Server Error',
                    text: 'A server error occurred while updating the status.'
                });
            }
        });
    }

    // ==========================================
    // 2. PRINT INVOICE ACTION
    // ==========================================
    if (printInvoiceBtn) {
        printInvoiceBtn.addEventListener("click", () => {
            // Simplest method: triggers the browser's native print dialog
            // Note: You may want to add a print-specific CSS file to format the page
            window.print();
        });
    }

    // ==========================================
    // 3. DOWNLOAD INVOICE ACTION
    // ==========================================
    if (downloadInvoiceBtn) {
        downloadInvoiceBtn.addEventListener("click", async () => {
            const orderId = downloadInvoiceBtn.getAttribute("data-order-id");
            
            try {
                // This requires a backend route that generates and sends a PDF blob
                const response = await fetch(`/admin/orders/${orderId}/invoice`);
                
                if (response.ok) {
                    const blob = await response.blob();
                    const downloadUrl = window.URL.createObjectURL(blob);
                    const a = document.createElement("a");
                    a.href = downloadUrl;
                    a.download = `Invoice-${orderId}.pdf`;
                    document.body.appendChild(a);
                    a.click();
                    a.remove();
                    window.URL.revokeObjectURL(downloadUrl);
                    
                    // Optional success toast
                    Swal.fire({
                        icon: 'success',
                        title: 'Downloaded!',
                        toast: true,
                        position: 'top-end',
                        showConfirmButton: false,
                        timer: 3000
                    });
                } else {
                    Swal.fire({
                        icon: 'error',
                        title: 'Failed',
                        text: 'Failed to generate invoice.'
                    });
                }
            } catch (error) {
                console.error("Error:", error);
                Swal.fire({
                    icon: 'error',
                    title: 'Error',
                    text: 'An error occurred while downloading the invoice.'
                });
            }
        });
    }

    // ==========================================
    // 4. ISSUE REFUND ACTION
    // ==========================================
    if (issueRefundBtn) {
        issueRefundBtn.addEventListener("click", async () => {
            const orderId = issueRefundBtn.getAttribute("data-order-id");
            
            // SweetAlert2 Confirmation Dialog
            const confirmResult = await Swal.fire({
                title: 'Are you sure?',
                text: "Do you want to issue a refund for this order? This action cannot be undone.",
                icon: 'warning',
                showCancelButton: true,
                confirmButtonColor: '#d33',
                cancelButtonColor: '#3085d6',
                confirmButtonText: 'Yes, issue refund!',
                cancelButtonText: 'Cancel'
            });

            if (confirmResult.isConfirmed) {
                try {
                    // Show a loading state while processing the refund
                    Swal.fire({
                        title: 'Processing Refund...',
                        text: 'Please wait while we process the request.',
                        allowOutsideClick: false,
                        didOpen: () => {
                            Swal.showLoading();
                        }
                    });

                    // This requires a backend route to process the refund via your payment gateway
                    const response = await fetch(`/admin/orders/${orderId}/refund`, {
                        method: "POST",
                        headers: { "Content-Type": "application/json" }
                    });

                    const result = await response.json();
                    
                    if (result.success) {
                        Swal.fire({
                            icon: 'success',
                            title: 'Refunded!',
                            text: 'Refund issued successfully.',
                            confirmButtonColor: '#3085d6'
                        }).then(() => {
                            window.location.reload();
                        });
                    } else {
                        Swal.fire({
                            icon: 'error',
                            title: 'Refund Failed',
                            text: result.error || "Failed to issue refund."
                        });
                    }
                } catch (error) {
                    console.error("Error:", error);
                    Swal.fire({
                        icon: 'error',
                        title: 'Server Error',
                        text: 'A server error occurred while processing the refund.'
                    });
                }
            }
        });
    }
});