document.addEventListener("DOMContentLoaded", () => {
    const sidebarToggle = document.getElementById('sidebarToggle');
    if (sidebarToggle) {
        sidebarToggle.addEventListener('click', () => document.getElementById('sidebar').classList.toggle('active'));
    }
    const updateItemBtns = document.querySelectorAll(".update-item-btn");
    const downloadInvoiceBtn = document.getElementById("downloadInvoiceBtn"); 
    const printInvoiceBtn = document.getElementById("printInvoiceBtn"); 
    const issueRefundBtn = document.getElementById("issueRefundBtn"); 

    updateItemBtns.forEach(btn => {
        btn.addEventListener("click", async () => {
            const orderId = btn.getAttribute("data-order-id");
            const itemId = btn.getAttribute("data-item-id");
            const statusDropdown = document.getElementById(`status-${itemId}`);
            const selectedStatus = statusDropdown.value;

            try {
                const response = await fetch(`/admin/orders/${orderId}/item/${itemId}/status`, {
                    method: "PATCH", 
                    headers: { "Content-Type": "application/json" }, 
                    body: JSON.stringify({ status: selectedStatus }) 
                });
                const result = await response.json(); 
                if (result.success) { 
                    Swal.fire({ icon: 'success', title: 'Success!', text: result.message, timer: 2000, showConfirmButton: false }).then(() => window.location.reload()); 
                } else {
                    Swal.fire({ icon: 'error', title: 'Failed', text: result.error || "Failed to update status" }); 
                }
            } catch (error) { 
                console.error("Error:", error); Swal.fire({ icon: 'error', title: 'Server Error', text: 'A server error occurred while updating the status.' }); 
            }
        });
    });

    if (printInvoiceBtn) printInvoiceBtn.addEventListener("click", () => window.print()); //[cite: 44]

    if (downloadInvoiceBtn) { //[cite: 44]
        downloadInvoiceBtn.addEventListener("click", async () => { //[cite: 44]
            const orderId = downloadInvoiceBtn.getAttribute("data-order-id"); //[cite: 44]
            try {
                const response = await fetch(`/admin/orders/${orderId}/invoice`); //[cite: 44]
                if (response.ok) { //[cite: 44]
                    const blob = await response.blob(); const downloadUrl = window.URL.createObjectURL(blob); const a = document.createElement("a"); //[cite: 44]
                    a.href = downloadUrl; a.download = `Invoice-${orderId}.pdf`; document.body.appendChild(a); a.click(); a.remove(); window.URL.revokeObjectURL(downloadUrl); //[cite: 44]
                    Swal.fire({ icon: 'success', title: 'Downloaded!', toast: true, position: 'top-end', showConfirmButton: false, timer: 3000 }); //[cite: 44]
                } else {
                    Swal.fire({ icon: 'error', title: 'Failed', text: 'Failed to generate invoice.' }); //[cite: 44]
                }
            } catch (error) { //[cite: 44]
                console.error("Error:", error); Swal.fire({ icon: 'error', title: 'Error', text: 'An error occurred while downloading the invoice.' }); //[cite: 44]
            }
        });
    }

    if (issueRefundBtn) { //[cite: 44]
        issueRefundBtn.addEventListener("click", async () => { //[cite: 44]
            const orderId = issueRefundBtn.getAttribute("data-order-id"); //[cite: 44]
            const confirmResult = await Swal.fire({ title: 'Are you sure?', text: "Do you want to issue a refund for this order? This action cannot be undone.", icon: 'warning', showCancelButton: true, confirmButtonColor: '#d33', cancelButtonColor: '#3085d6', confirmButtonText: 'Yes, issue refund!', cancelButtonText: 'Cancel' }); //[cite: 44]
            if (confirmResult.isConfirmed) { //[cite: 44]
                try {
                    Swal.fire({ title: 'Processing Refund...', text: 'Please wait while we process the request.', allowOutsideClick: false, didOpen: () => Swal.showLoading() }); //[cite: 44]
                    const response = await fetch(`/admin/orders/${orderId}/refund`, { method: "POST", headers: { "Content-Type": "application/json" } }); //[cite: 44]
                    const result = await response.json(); //[cite: 44]
                    if (result.success) { //[cite: 44]
                        Swal.fire({ icon: 'success', title: 'Refunded!', text: 'Refund issued successfully.', confirmButtonColor: '#3085d6' }).then(() => window.location.reload()); //[cite: 44]
                    } else {
                        Swal.fire({ icon: 'error', title: 'Refund Failed', text: result.error || "Failed to issue refund." }); //[cite: 44]
                    }
                } catch (error) { //[cite: 44]
                    console.error("Error:", error); Swal.fire({ icon: 'error', title: 'Server Error', text: 'A server error occurred while processing the refund.' }); //[cite: 44]
                }
            }
        });
    }
});