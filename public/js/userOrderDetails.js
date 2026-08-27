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
  document.querySelectorAll(".return-item-btn").forEach((button) => {
    button.addEventListener("click", async () => {
      const orderId = button.dataset.orderId;
      const itemId = button.dataset.itemId;

      const result = await Swal.fire({
        title: "Return this item?",
        input: "textarea",
        inputLabel: "Reason",
        inputPlaceholder: "Tell us why you are returning this item",
        icon: "warning",
        showCancelButton: true,
        confirmButtonText: "Return item",
        confirmButtonColor: "#f0ad4e"
      });

      if (!result.isConfirmed) return;

      try {
        const response = await fetch(`/orders/${orderId}/items/${itemId}/return`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ returnReason: result.value || "Returned by user" })
        });
        const data = await response.json();

        if (!data.success) {
          Swal.fire("Error", data.error || "Unable to return item.", "error");
          return;
        }

        const itemRow = document.getElementById(`item-${itemId}`);
        if (itemRow) {
          const status = itemRow.querySelector(".item-status");
          if (status) status.textContent = "Returned";
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

        Swal.fire("Returned", data.refundAmount > 0 ? `Refund of ₹${data.refundAmount} credited to wallet.` : "The item has been returned.", "success");
      } catch (error) {
        console.error(error);
        Swal.fire("Error", "A server error occurred.", "error");
      }
    });
  });

  const retryBtn = document.getElementById("retryPaymentBtn");
  if (retryBtn) {
    retryBtn.addEventListener("click", async () => {
      try {
        const orderId = retryBtn.dataset.orderId;
        retryBtn.disabled = true;
        retryBtn.textContent = "Processing...";

        const response = await fetch(`/payment/retry/${orderId}`, {
          method: "POST"
        });
        const data = await response.json();

        if (data.success && data.razorpayOrder) {
          const options = {
            key: data.key_id,
            amount: data.razorpayOrder.amount,
            currency: data.razorpayOrder.currency,
            name: "E-Commerce",
            description: "Retry Payment",
            order_id: data.razorpayOrder.id,
            handler: function (response) {
              fetch("/payment/verify", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  razorpay_payment_id: response.razorpay_payment_id,
                  razorpay_order_id: response.razorpay_order_id,
                  razorpay_signature: response.razorpay_signature,
                  order_id: data.orderId
                })
              })
              .then(res => res.json())
              .then(verifyData => {
                if (verifyData.success) {
                  window.location.href = verifyData.redirectUrl;
                } else {
                  Swal.fire("Error", "Payment verification failed", "error");
                  retryBtn.disabled = false;
                  retryBtn.textContent = "Retry Payment";
                }
              });
            },
            prefill: {
              name: "Customer",
              email: "customer@example.com",
              contact: "9999999999"
            },
            theme: { color: "#3399cc" }
          };
          
          const rzp1 = new Razorpay(options);
          rzp1.on('payment.failed', function (response) {
            Swal.fire("Error", "Payment failed. Please try again.", "error");
            retryBtn.disabled = false;
            retryBtn.textContent = "Retry Payment";
          });
          rzp1.open();
        } else {
          Swal.fire("Error", data.message || "Unable to initiate payment retry.", "error");
          retryBtn.disabled = false;
          retryBtn.textContent = "Retry Payment";
        }
      } catch (err) {
        console.error(err);
        Swal.fire("Error", "An unexpected error occurred.", "error");
        retryBtn.disabled = false;
        retryBtn.textContent = "Retry Payment";
      }
    });
  }
});
