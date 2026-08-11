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
                    alert(result.message);
                    window.location.reload();
                } else {
                    alert(result.error || "Failed to update status");
                }
            } catch (error) {
                console.error("Error:", error);
                alert("Server error occurred.");
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
                } else {
                    alert("Failed to generate invoice.");
                }
            } catch (error) {
                console.error("Error:", error);
                alert("Error downloading invoice.");
            }
        });
    }

    // ==========================================
    // 4. ISSUE REFUND ACTION
    // ==========================================
    if (issueRefundBtn) {
        issueRefundBtn.addEventListener("click", async () => {
            const orderId = issueRefundBtn.getAttribute("data-order-id");
            
            // Add a confirmation dialog to prevent accidental refunds
            if (confirm("Are you sure you want to issue a refund for this order? This action cannot be undone.")) {
                try {
                    // This requires a backend route to process the refund via your payment gateway
                    const response = await fetch(`/admin/orders/${orderId}/refund`, {
                        method: "POST",
                        headers: { "Content-Type": "application/json" }
                    });

                    const result = await response.json();
                    if (result.success) {
                        alert("Refund issued successfully.");
                        window.location.reload();
                    } else {
                        alert(result.error || "Failed to issue refund.");
                    }
                } catch (error) {
                    console.error("Error:", error);
                    alert("Server error processing refund.");
                }
            }
        });
    }
});