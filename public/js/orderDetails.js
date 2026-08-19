document.addEventListener("DOMContentLoaded", () => {
    const sidebarToggle = document.getElementById('sidebarToggle');
    if (sidebarToggle) {
        sidebarToggle.addEventListener('click', () => document.getElementById('sidebar').classList.toggle('active'));
    }
    const updateStatusBtn = document.getElementById("updateStatusBtn"); //[cite: 44]
    const downloadInvoiceBtn = document.getElementById("downloadInvoiceBtn"); //[cite: 44]
    const printInvoiceBtn = document.getElementById("printInvoiceBtn"); //[cite: 44]
    const issueRefundBtn = document.getElementById("issueRefundBtn"); //[cite: 44]
    const statusDropdown = document.getElementById("orderStatus"); //[cite: 44]

    if (updateStatusBtn && statusDropdown) { //[cite: 44]
        updateStatusBtn.addEventListener("click", async () => { //[cite: 44]
            const orderId = statusDropdown.getAttribute("data-order-id");
            const selectedStatus = statusDropdown.value; //[cite: 44]
            try {
                const response = await fetch(`/admin/orders/${orderId}/status`, { //[cite: 44]
                    method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ status: selectedStatus }) //[cite: 44]
                });
                const result = await response.json(); //[cite: 44]
                if (result.success) { //[cite: 44]
                    Swal.fire({ icon: 'success', title: 'Success!', text: result.message, timer: 2000, showConfirmButton: false }).then(() => window.location.reload()); //[cite: 44]
                } else {
                    Swal.fire({ icon: 'error', title: 'Failed', text: result.error || "Failed to update status" }); //[cite: 44]
                }
            } catch (error) { //[cite: 44]
                console.error("Error:", error); Swal.fire({ icon: 'error', title: 'Server Error', text: 'A server error occurred while updating the status.' }); //[cite: 44]
            }
        });
    }

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