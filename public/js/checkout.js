let appliedCouponId = null;
let currentCouponDiscount = 0;

function selectAddress(element) {
    document.querySelectorAll('.address-card').forEach(card => card.classList.remove('selected'));
    element.classList.add('selected');
    element.querySelector('input[type="radio"]').checked = true;
}

function renderCheckoutAddress(address) {
    const list = document.getElementById('checkoutAddressList');
    if (!list) return;

    const card = document.createElement('div');
    card.className = 'address-card selected';
    card.onclick = () => selectAddress(card, address._id);
    card.innerHTML = `
        <input type="radio" name="selectedAddr" value="${address._id}" checked>
        <div class="d-flex align-items-center gap-2 mb-3">
            <strong class="fs-6">${address.fullName}</strong>
            <span class="badge-type">${address.addressType}</span>
        </div>
        <div class="address-text">
            <p class="mb-1">${address.addressLine}</p>
            ${address.landmark ? `<p class="mb-1 text-dark-50">Landmark: ${address.landmark}</p>` : ''}
            <p class="mb-2">${address.city}, ${address.state} - ${address.pincode}</p>
            <p class="mb-0 text-dark fw-500" style="font-size: 0.88rem;">Phone: ${address.phone}</p>
        </div>
    `;

    document.querySelectorAll('.address-card').forEach(existingCard => existingCard.classList.remove('selected'));
    document.querySelectorAll('input[name="selectedAddr"]').forEach(radio => { radio.checked = false; });
    list.prepend(card);

    const emptyState = document.getElementById('emptyAddressState');
    if (emptyState) emptyState.classList.add('d-none');

    const placeOrderBtn = document.getElementById('placeOrderBtn');
    if (placeOrderBtn) {
        placeOrderBtn.disabled = false;
        placeOrderBtn.classList.remove('opacity-50');
        placeOrderBtn.textContent = 'Place Order';
    }
}

document.addEventListener('DOMContentLoaded', () => {
    const addressForm = document.getElementById('checkoutAddressForm');
    if (!addressForm) return;

    addressForm.addEventListener('submit', async (event) => {
        event.preventDefault();
        const formData = Object.fromEntries(new FormData(addressForm).entries());

        try {
            const response = await fetch('/address?returnTo=checkout', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                },
                body: JSON.stringify(formData)
            });
            const data = await response.json();

            if (!data.success) {
                Swal.fire('Error', data.error || 'Failed to save address.', 'error');
                return;
            }

            renderCheckoutAddress(data.address);
            addressForm.reset();
            const modalEl = document.getElementById('checkoutAddressModal');
            const modal = bootstrap.Modal.getInstance(modalEl) || new bootstrap.Modal(modalEl);
            modal.hide();
            Swal.fire({ icon: 'success', title: 'Address added', timer: 1300, showConfirmButton: false });
        } catch (error) {
            console.error(error);
            Swal.fire('Error', 'Server Error', 'error');
        }
    });
});

// Coupon Logic
function fillAndApplyCoupon(code) {
    document.getElementById("couponCode").value = code;
    applyCoupon();
}

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
                    window.location.href = data.redirectUrl || '/payment/success';
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
                            window.location.href = verifyData.redirectUrl || '/payment/success';
                        } else {
                            window.location.href = '/payment/failure';
                        }
                    },
                    theme: { color: "#3399cc" }
                };
                
                const rzp = new window.Razorpay(options);
                rzp.on('payment.failed', async function (response){
                    try {
                        await fetch('/payment/failure-callback', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ order_id: data.orderId })
                        });
                    } catch(err) {
                        console.error("Failed to notify backend of payment failure", err);
                    }
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
