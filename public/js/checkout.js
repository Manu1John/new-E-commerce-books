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

    // ─── Validation Rules ───────────────────────────────────────────────────
    const RULES = {
        fullName: {
            validate: v => /^[A-Za-z\s]{3,50}$/.test(v.trim()),
            message: 'Enter a valid full name (letters only, 3–50 chars)'
        },
        phone: {
            validate: v => /^[6-9][0-9]{9}$/.test(v.trim()),
            message: 'Enter valid 10-digit phone number'
        },
        house: {
            validate: v => v.trim().length > 0,
            message: 'House details required'
        },
        area: {
            validate: v => v.trim().length > 0,
            message: 'Area / Street is required'
        },
        city: {
            validate: v => /^[A-Za-z\s]{2,}$/.test(v.trim()),
            message: 'Enter a valid city name'
        },
        state: {
            validate: v => /^[A-Za-z\s]{2,}$/.test(v.trim()),
            message: 'Enter a valid state name'
        },
        pincode: {
            validate: v => /^[1-9][0-9]{5}$/.test(v.trim()),
            message: 'Enter valid 6-digit pincode'
        }
    };

    // ─── Show / Clear error for a single field ───────────────────────────────
    function setError(errorElId, message) {
        const el = document.getElementById(errorElId);
        if (el) el.textContent = message;
    }
    function clearError(errorElId) {
        const el = document.getElementById(errorElId);
        if (el) el.textContent = '';
    }

    // ─── Validate a single input and show/clear its error ───────────────────
    function validateField(prefix, fieldName) {
        const input = document.getElementById(`${prefix}${fieldName.charAt(0).toUpperCase() + fieldName.slice(1)}`);
        const errorId = `${prefix}${fieldName.charAt(0).toUpperCase() + fieldName.slice(1)}Error`;
        if (!input || !RULES[fieldName]) return true;
        const value = input.value;
        if (!RULES[fieldName].validate(value)) {
            setError(errorId, RULES[fieldName].message);
            return false;
        }
        clearError(errorId);
        return true;
    }

    // ─── Validate entire form, return true if all pass ───────────────────────
    function validateAddressForm(prefix) {
        let valid = true;
        for (const field of Object.keys(RULES)) {
            if (!validateField(prefix, field)) valid = false;
        }
        return valid;
    }

    // ─── Attach real-time blur validation to a form ─────────────────────────
    function attachBlurValidation(formId, prefix) {
        const form = document.getElementById(formId);
        if (!form) return;
        for (const field of Object.keys(RULES)) {
            const inputId = `${prefix}${field.charAt(0).toUpperCase() + field.slice(1)}`;
            const input = document.getElementById(inputId);
            if (input) {
                input.addEventListener('blur', () => validateField(prefix, field));
                input.addEventListener('input', () => {
                    // Clear error as soon as user starts correcting
                    const errorId = `${prefix}${field.charAt(0).toUpperCase() + field.slice(1)}Error`;
                    if (input.value.trim()) clearError(errorId);
                });
            }
        }
    }

    attachBlurValidation('checkoutAddressForm', 'add');
    attachBlurValidation('editCheckoutAddressForm', 'edit');

    // ─── Add Address Form Submit ─────────────────────────────────────────────
    const addressForm = document.getElementById('checkoutAddressForm');
    if (addressForm) {
        addressForm.addEventListener('submit', async (event) => {
            event.preventDefault();
            if (!validateAddressForm('add')) return;

            const formData = Object.fromEntries(new FormData(addressForm).entries());

            try {
                const response = await fetch('/address?returnTo=checkout', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
                    body: JSON.stringify(formData)
                });
                const data = await response.json();

                if (!data.success) {
                    Swal.fire('Error', data.error || 'Failed to save address.', 'error');
                    return;
                }

                renderCheckoutAddress(data.address);
                addressForm.reset();
                // Clear all errors on reset
                Object.keys(RULES).forEach(f => clearError(`add${f.charAt(0).toUpperCase() + f.slice(1)}Error`));
                const modalEl = document.getElementById('checkoutAddressModal');
                const modal = bootstrap.Modal.getInstance(modalEl) || new bootstrap.Modal(modalEl);
                modal.hide();
                Swal.fire({ icon: 'success', title: 'Address added', timer: 1300, showConfirmButton: false }).then(() => {
                    location.reload();
                });
            } catch (error) {
                console.error(error);
                Swal.fire('Error', 'Server Error', 'error');
            }
        });
    }

    // ─── Edit Address Form Submit ────────────────────────────────────────────
    const editAddressForm = document.getElementById('editCheckoutAddressForm');
    if (editAddressForm) {
        editAddressForm.addEventListener('submit', async (event) => {
            event.preventDefault();
            if (!validateAddressForm('edit')) return;

            const addressId = document.getElementById('editAddressId').value;
            const formData = Object.fromEntries(new FormData(editAddressForm).entries());

            try {
                const response = await fetch(`/address/${addressId}?returnTo=checkout`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
                    body: JSON.stringify(formData)
                });
                const data = await response.json();

                if (!data.success) {
                    Swal.fire('Error', data.error || 'Failed to update address.', 'error');
                    return;
                }

                const modalEl = document.getElementById('editCheckoutAddressModal');
                const modal = bootstrap.Modal.getInstance(modalEl) || new bootstrap.Modal(modalEl);
                modal.hide();
                Swal.fire({ icon: 'success', title: 'Address updated', timer: 1300, showConfirmButton: false }).then(() => {
                    location.reload();
                });
            } catch (error) {
                console.error(error);
                Swal.fire('Error', 'Server Error', 'error');
            }
        });
    }

    // ─── Clear edit form errors when modal closes ────────────────────────────
    const editModal = document.getElementById('editCheckoutAddressModal');
    if (editModal) {
        editModal.addEventListener('hidden.bs.modal', () => {
            Object.keys(RULES).forEach(f => clearError(`edit${f.charAt(0).toUpperCase() + f.slice(1)}Error`));
        });
    }
    const addModal = document.getElementById('checkoutAddressModal');
    if (addModal) {
        addModal.addEventListener('hidden.bs.modal', () => {
            Object.keys(RULES).forEach(f => clearError(`add${f.charAt(0).toUpperCase() + f.slice(1)}Error`));
        });
    }
});


async function openEditAddressModal(addressId, event) {
    if (event) {
        event.stopPropagation();
    }
    
    try {
        const response = await fetch(`/address/${addressId}/edit?returnTo=checkout`, {
            headers: {
                'Accept': 'application/json'
            }
        });
        const data = await response.json();
        
        if (data.success && data.address) {
            const addr = data.address;
            document.getElementById('editAddressId').value = addr._id;
            document.getElementById('editFullName').value = addr.fullName;
            document.getElementById('editPhone').value = addr.phone;
            document.getElementById('editHouse').value = addr.house;
            document.getElementById('editArea').value = addr.area;
            document.getElementById('editLandmark').value = addr.landmark || '';
            document.getElementById('editCity').value = addr.city;
            document.getElementById('editState').value = addr.state;
            document.getElementById('editPincode').value = addr.pincode;
            document.getElementById('editAddressType').value = addr.addressType;
            
            const modalEl = document.getElementById('editCheckoutAddressModal');
            const modal = new bootstrap.Modal(modalEl);
            modal.show();
        } else {
            Swal.fire('Error', 'Could not load address details', 'error');
        }
    } catch (error) {
        console.error(error);
        Swal.fire('Error', 'Server Error while fetching address', 'error');
    }
}

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
