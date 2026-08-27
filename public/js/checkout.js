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
    // Frontend Validation Helper
    const validateAddressForm = (form) => {
        let isValid = true;
        // Remove previous errors
        form.querySelectorAll('.address-err').forEach(el => el.remove());

        const showError = (inputName, message) => {
            const input = form.querySelector(`[name="${inputName}"]`);
            if (input) {
                const errDiv = document.createElement('div');
                errDiv.className = 'address-err text-danger small mt-1';
                errDiv.innerText = message;
                input.parentNode.appendChild(errDiv);
            }
            isValid = false;
        };

        const formData = Object.fromEntries(new FormData(form).entries());

        const requiredFields = ["fullName", "phone", "house", "area", "city", "state", "pincode", "addressType"];
        for (const field of requiredFields) {
            if (!formData[field] || !String(formData[field]).trim()) {
                showError(field, 'This field cannot be empty or just spaces.');
            }
        }

        if (!isValid) return false;

        const fullName = String(formData.fullName).trim();
        if (fullName.length < 3 || fullName.length > 50) showError('fullName', 'Name must be between 3 and 50 characters.');
        else if (!/^[A-Za-z\s]+$/.test(fullName)) showError('fullName', 'Name can only contain letters and spaces.');

        const phone = String(formData.phone).trim();
        if (!/^[0-9]{10}$/.test(phone)) showError('phone', 'Phone number must be exactly 10 digits.');
        else if (/^0{10}$/.test(phone)) showError('phone', 'Phone number cannot be all zeros.');

        const pincode = String(formData.pincode).trim();
        if (!/^[0-9]{6}$/.test(pincode)) showError('pincode', 'Pincode must be exactly 6 digits.');
        else if (/^0{6}$/.test(pincode)) showError('pincode', 'Pincode cannot be all zeros.');

        const city = String(formData.city).trim();
        if (!/^[A-Za-z\s]+$/.test(city)) showError('city', 'City cannot contain numbers or special characters.');

        const state = String(formData.state).trim();
        if (!/^[A-Za-z\s]+$/.test(state)) showError('state', 'State cannot contain numbers or special characters.');

        const xssPattern = /<[^>]*>?/gm;
        const addressPattern = /^[A-Za-z0-9\s,\-]+$/;

        const house = String(formData.house).trim();
        if (xssPattern.test(house) || !addressPattern.test(house)) showError('house', 'Contains invalid characters.');

        const area = String(formData.area).trim();
        if (xssPattern.test(area) || !addressPattern.test(area)) showError('area', 'Contains invalid characters.');

        if (formData.landmark) {
            const landmark = String(formData.landmark).trim();
            if (xssPattern.test(landmark) || !/^[A-Za-z0-9\s,\-]*$/.test(landmark)) {
                showError('landmark', 'Contains invalid characters.');
            }
        }

        return isValid;
    };

    const addressForm = document.getElementById('checkoutAddressForm');
    if (addressForm) {
        addressForm.addEventListener('submit', async (event) => {
            event.preventDefault();
            
            if (!validateAddressForm(addressForm)) return;

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
                Swal.fire({ icon: 'success', title: 'Address added', timer: 1300, showConfirmButton: false }).then(() => {
                    location.reload(); // Reload to refresh addresses properly
                });
            } catch (error) {
                console.error(error);
                Swal.fire('Error', 'Server Error', 'error');
            }
        });
    }

    // Edit Address Logic
    const editAddressForm = document.getElementById('editCheckoutAddressForm');
    if (editAddressForm) {
        editAddressForm.addEventListener('submit', async (event) => {
            event.preventDefault();

            if (!validateAddressForm(editAddressForm)) return;

            const addressId = document.getElementById('editAddressId').value;
            const formData = Object.fromEntries(new FormData(editAddressForm).entries());

            try {
                const response = await fetch(`/address/${addressId}?returnTo=checkout`, {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json',
                        'Accept': 'application/json'
                    },
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
                    location.reload(); // Reload to refresh list
                });
            } catch (error) {
                console.error(error);
                Swal.fire('Error', 'Server Error', 'error');
            }
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
