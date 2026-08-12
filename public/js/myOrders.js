document.addEventListener("DOMContentLoaded", () => {
    
    // ==========================================
    // 1. DYNAMIC TRACK ORDER LOGIC
    // ==========================================
    const trackBtns = document.querySelectorAll('.track-order-btn');
    
    trackBtns.forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.preventDefault();
            
            // Extract data from the clicked button
            const status = btn.getAttribute('data-status');
            const dateStr = btn.getAttribute('data-date');
            const date = new Date(dateStr).toLocaleDateString();
            
            // Update Payment Summary Panel
            document.getElementById('sum-subtotal').textContent = '$' + parseFloat(btn.getAttribute('data-total') || 0).toFixed(2);
            document.getElementById('sum-shipping').textContent = '$' + parseFloat(btn.getAttribute('data-shipping') || 0).toFixed(2);
            document.getElementById('sum-tax').textContent = '$' + parseFloat(btn.getAttribute('data-tax') || 0).toFixed(2);
            document.getElementById('sum-discount').textContent = '-$' + parseFloat(btn.getAttribute('data-discount') || 0).toFixed(2);
            document.getElementById('sum-total').textContent = '$' + parseFloat(btn.getAttribute('data-final') || 0).toFixed(2);

            // Update Timeline Logic
            const timeline = document.getElementById('tracking-timeline');
            timeline.innerHTML = generateTimelineHTML(status, date);
            
            // On mobile devices, smoothly scroll down to the tracking column
            if (window.innerWidth < 900) {
                document.querySelector('.right-col').scrollIntoView({ behavior: 'smooth' });
            }
        });
    });

    // Helper function to build the timeline UI based on current order status
    function generateTimelineHTML(status, date) {
        // Handle negative statuses separately
        if (["Cancelled", "Returned", "Refunded"].includes(status)) {
            return `
                <div class="timeline-item active">
                    <div class="dot" style="background-color: #d9534f;"></div>
                    <div class="content">
                        <strong style="color: #d9534f;">Order ${status}</strong>
                        <p>${date} - This order has been ${status.toLowerCase()}.</p>
                    </div>
                </div>
            `;
        }

        // Define the standard progression
        const stages = [
            { label: "Order Confirmed", desc: "Your order has been placed successfully." },
            { label: "Packed", desc: "Seller packed your items carefully." },
            { label: "Shipped", desc: "Shipment is on the way." },
            { label: "Delivered", desc: "Order has been delivered." }
        ];

        // Map textual statuses to an index level (0 to 4)
        const statusMap = {
            "Pending": 0, "Confirmed": 1, "Processing": 1, 
            "Packed": 2, "Shipped": 3, "Out for Delivery": 3, "Delivered": 4
        };
        
        let currentIndex = statusMap[status] || 0;
        let html = '';

        stages.forEach((stage, index) => {
            const isActive = index < currentIndex;
            const stateClass = isActive ? 'active' : 'pending';
            
            html += `
                <div class="timeline-item ${stateClass}">
                    <div class="dot"></div>
                    <div class="content">
                        <strong>${stage.label}</strong>
                        <p>${index === 0 ? date + ' - ' : ''}${isActive ? stage.desc : 'Pending...'}</p>
                    </div>
                </div>
            `;
        });

        return html;
    }

    // Automatically click the first track button on page load to fill the right column
    if (trackBtns.length > 0) {
        trackBtns[0].click();
    }

    // ==========================================
    // 2. CANCEL ORDER LOGIC
    // ==========================================
    const cancelModal = document.getElementById("cancelOrderModal");
    const openCancelBtns = document.querySelectorAll(".open-cancel-modal");
    const closeBtns = document.querySelectorAll(".close-modal-btn, .cancel-modal-btn");
    const cancelForm = document.getElementById("cancelOrderForm");
    const otherReasonGroup = document.getElementById("otherReasonGroup");
    const radioButtons = document.querySelectorAll('input[name="cancelReason"]');
    const cancelOrderIdInput = document.getElementById("cancelOrderId");

    openCancelBtns.forEach(btn => {
        btn.addEventListener("click", (e) => {
            e.preventDefault();
            cancelOrderIdInput.value = btn.getAttribute("data-order-id"); 
            cancelModal.classList.remove("hidden");
        });
    });

    const closeModal = () => {
        cancelModal.classList.add("hidden");
        cancelForm.reset(); 
        otherReasonGroup.classList.add("hidden"); 
    };

    closeBtns.forEach(btn => btn.addEventListener("click", closeModal));

    radioButtons.forEach(radio => {
        radio.addEventListener("change", (e) => {
            if (e.target.value === "Other") {
                otherReasonGroup.classList.remove("hidden");
                document.getElementById("otherReasonText").setAttribute("required", "true");
            } else {
                otherReasonGroup.classList.add("hidden");
                document.getElementById("otherReasonText").removeAttribute("required");
            }
        });
    });

    cancelForm.addEventListener("submit", async (e) => {
        e.preventDefault();
        const orderId = cancelOrderIdInput.value;
        const formData = new FormData(cancelForm);
        const reason = formData.get("cancelReason");
        const otherReason = formData.get("otherReasonText");
        const finalReason = reason === "Other" ? otherReason : reason;

        try {
            const response = await fetch(`/orders/${orderId}/cancel`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ cancellationReason: finalReason })
            });
            const result = await response.json();
            
            if (result.success) {
                closeModal();
                alert("Your order has been successfully cancelled.");
                window.location.reload(); 
            } else {
                alert(result.error || "Failed to cancel the order.");
            }
        } catch (error) {
            console.error("Error:", error);
            alert("A network or server error occurred while processing your request.");
        }
    });

    // ==========================================
    // 3. RETURN ORDER LOGIC
    // ==========================================
    const returnModal = document.getElementById("returnOrderModal");
    const openReturnBtns = document.querySelectorAll(".open-return-modal");
    const closeReturnBtn = document.getElementById("closeReturnModalBtn");
    const cancelReturnBtn = document.getElementById("cancelReturnModalBtn");
    const returnForm = document.getElementById("returnOrderForm");
    const otherReturnReasonGroup = document.getElementById("otherReturnReasonGroup");
    const returnRadioButtons = document.querySelectorAll('input[name="returnReason"]');
    const returnOrderIdInput = document.getElementById("returnOrderId");

    openReturnBtns.forEach(btn => {
        btn.addEventListener("click", (e) => {
            e.preventDefault();
            returnOrderIdInput.value = btn.getAttribute("data-order-id"); 
            returnModal.classList.remove("hidden");
        });
    });

    const closeReturnModal = () => {
        returnModal.classList.add("hidden");
        returnForm.reset(); 
        otherReturnReasonGroup.classList.add("hidden"); 
    };

    if (closeReturnBtn) closeReturnBtn.addEventListener("click", closeReturnModal);
    if (cancelReturnBtn) cancelReturnBtn.addEventListener("click", closeReturnModal);

    returnRadioButtons.forEach(radio => {
        radio.addEventListener("change", (e) => {
            if (e.target.value === "Other") {
                otherReturnReasonGroup.classList.remove("hidden");
                document.getElementById("otherReturnReasonText").setAttribute("required", "true");
            } else {
                otherReturnReasonGroup.classList.add("hidden");
                document.getElementById("otherReturnReasonText").removeAttribute("required");
            }
        });
    });

    returnForm.addEventListener("submit", async (e) => {
        e.preventDefault();
        const orderId = returnOrderIdInput.value;
        const formData = new FormData(returnForm);
        const reason = formData.get("returnReason");
        const otherReason = formData.get("otherReturnReasonText");
        const finalReason = reason === "Other" ? otherReason : reason;

        try {
            const response = await fetch(`/orders/${orderId}/return`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ returnReason: finalReason })
            });
            const result = await response.json();
            
            if (result.success) {
                closeReturnModal();
                alert("Your order return has been initiated successfully.");
                window.location.reload(); 
            } else {
                alert(result.error || "Failed to process the return.");
            }
        } catch (error) {
            console.error("Error:", error);
            alert("A network or server error occurred while processing your request.");
        }
    });

});