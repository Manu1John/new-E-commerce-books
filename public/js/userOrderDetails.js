document.addEventListener("DOMContentLoaded", () => {
  document.querySelectorAll(".cancel-item-btn").forEach((button) => {
    button.addEventListener("click", async () => {
      const orderId = button.dataset.orderId;
      const itemId = button.dataset.itemId;

      const result = await Swal.fire({
        title: "Cancel this item?",
        input: "textarea",
        inputLabel: "Reason",
        inputPlaceholder: "Tell us why you are cancelling this item",
        icon: "warning",
        showCancelButton: true,
        confirmButtonText: "Cancel item",
        confirmButtonColor: "#dc3545"
      });

      if (!result.isConfirmed) return;

      try {
        const response = await fetch(`/orders/${orderId}/items/${itemId}/cancel`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ cancellationReason: result.value || "Cancelled by user" })
        });
        const data = await response.json();

        if (!data.success) {
          Swal.fire("Error", data.error || "Unable to cancel item.", "error");
          return;
        }

        const itemRow = document.getElementById(`item-${itemId}`);
        if (itemRow) {
          const status = itemRow.querySelector(".item-status");
          if (status) status.textContent = "Cancelled";
          button.remove();
        }

        if (data.order?.displayStatus) {
          const overall = document.getElementById("overallOrderStatus");
          if (overall) overall.textContent = data.order.displayStatus;
        }
        if (data.order?.money) {
          document.getElementById("summarySubtotal").textContent = `₹${data.order.money.subtotal}`;
          document.getElementById("summaryDiscount").textContent = `-₹${data.order.money.totalDiscount}`;
          document.getElementById("summaryFinal").textContent = `₹${data.order.money.finalTotal}`;
        }

        Swal.fire("Cancelled", data.refundAmount > 0 ? `Refund of ₹${data.refundAmount} credited to wallet.` : "The item has been cancelled.", "success");
      } catch (error) {
        console.error(error);
        Swal.fire("Error", "A server error occurred.", "error");
      }
    });
  });
});
