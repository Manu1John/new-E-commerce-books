let appliedCouponId = null;
let currentCouponDiscount = 0;

function selectAddress(element) {
    document.querySelectorAll('.address-card').forEach(card => card.classList.remove('selected'));
    element.classList.add('selected');
    element.querySelector('input[type="radio"]').checked = true;
}

// Coupon Logic
async function applyCoupon() {
    const code = document.getElementById("couponCode").value;
    if (!code) return Swal.fire('Error', 'Please enter a coupon code', 'error');

    const res = await fetch('/cart/apply-coupon', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code })
    });
    const data = await res.json();
    
    if (data.success) {
        appliedCouponId = data.couponId;
        currentCouponDiscount = data.discountAmount;
        
        // Update UI dynamically
        document.getElementById("couponDiscountRow").classList.remove("d-none");
        document.getElementById("couponDiscountAmount").innerText = `-₹${currentCouponDiscount}`;
        
        const subtotal = parseFloat(document.getElementById("cartSubtotalValue").innerText);
        const newTotal = subtotal - currentCouponDiscount;
        document.getElementById("grandTotalValue").innerText = `₹${newTotal}`;
        
        Swal.fire('Success', 'Coupon applied!', 'success');
    } else {
        Swal.fire('Error', data.message, 'error');
    }
}

function removeCoupon() {
    appliedCouponId = null;
    currentCouponDiscount = 0;
    document.getElementById("couponCode").value = "";
    document.getElementById("couponDiscountRow").classList.add("d-none");
    
    const subtotal = parseFloat(document.getElementById("cartSubtotalValue").innerText);
    document.getElementById("grandTotalValue").innerText = `₹${subtotal}`;
}

async function placeOrder() {
    const selectedRadio = document.querySelector('input[name="selectedAddr"]:checked');
    if (!selectedRadio) return Swal.fire('Error', 'Please select a delivery address.', 'warning');

    const addressId = selectedRadio.value;
    const useWallet = document.getElementById("useWalletCheckbox") ? document.getElementById("useWalletCheckbox").checked : false;
    const paymentMethod = document.querySelector('input[name="paymentMethod"]:checked').value; // 'COD' or 'Online'

    if (paymentMethod === 'COD' && useWallet) {
        return Swal.fire('Error', 'Wallet payment cannot be combined with COD. Please select Online Payment.', 'error');
    }

    Swal.fire({ title: 'Processing...', allowOutsideClick: false, didOpen: () => Swal.showLoading() });

    try {
        const res = await fetch('/payment/create-order', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
                addressId, 
                useWallet, 
                couponDiscount: currentCouponDiscount,
                couponId: appliedCouponId,
                paymentMethod // Passed to backend
            })
        });
        const data = await res.json();

        if (data.success) {
            // If COD or Fully paid by Wallet
            if (data.walletOnly || data.isCOD) {
                Swal.fire('Success', 'Order Placed!', 'success').then(() => {
                    window.location.href = '/payment/success';
                });
                return;
            }

            // Online Payment via Razorpay
            if (data.razorpayOrder) {
                const options = {
                    key: data.key_id, // FIX: Dynamic key from backend
                    amount: data.razorpayOrder.amount,
                    currency: "INR",
                    name: "BookStore",
                    description: "Order Payment",
                    order_id: data.razorpayOrder.id,
                    handler: async function (response) {
                        // Verify Payment
                        const verifyRes = await fetch('/payment/verify', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({
                                razorpay_order_id: response.razorpay_order_id,
                                razorpay_payment_id: response.razorpay_payment_id,
                                razorpay_signature: response.razorpay_signature,
                                order_id: data.orderId
                            })
                        });
                        const verifyData = await verifyRes.json();
                        if (verifyData.success) {
                            window.location.href = '/payment/success';
                        } else {
                            window.location.href = '/payment/failure';
                        }
                    },
                    theme: { color: "#3399cc" }
                };
                
                const rzp = new window.Razorpay(options);
                rzp.on('payment.failed', function (response){
                    window.location.href = '/payment/failure';
                });
                rzp.open();
                Swal.close();
            }
        } else {
            Swal.fire('Error', data.message || 'Failed to place order', 'error');
        }
    } catch (err) {
        console.error(err);
        Swal.fire('Error', 'Server Error', 'error');
    }
}