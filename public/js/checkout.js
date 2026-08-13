// 2. Keep your selectAddress function exactly like this:
function selectAddress(element) {
    // Remove 'selected' class from all cards
    document.querySelectorAll('.address-card').forEach(card => card.classList.remove('selected'));
    
    // Add 'selected' class to the clicked card
    element.classList.add('selected');
    
    // Check the hidden radio button inside it
    element.querySelector('input[type="radio"]').checked = true;
}

// 3. Update your placeOrder function to grab the ID dynamically:
function placeOrder() {
    // Find the radio button that is currently checked
    const selectedRadio = document.querySelector('input[name="selectedAddr"]:checked');
    
    // If nothing is checked, stop here
    if (!selectedRadio) {
        Swal.fire({
            icon: 'warning',
            title: 'Address Required',
            text: 'Please select a delivery address.'
        });
        return;
    }

    // Extract the real ObjectId from the checked radio button
    const selectedAddressId = selectedRadio.value;

    // Show a loading state while the fetch request happens
    Swal.fire({
        title: 'Placing Order...',
        text: 'Please wait',
        allowOutsideClick: false,
        didOpen: () => {
            Swal.showLoading();
        }
    });

    // Send it to your backend
    fetch('/checkout/place', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ addressId: selectedAddressId })
    })
    .then(res => res.json())
    .then(data => {
        if (data.success) {
            Swal.fire({
                icon: 'success',
                title: 'Order Confirmed!',
                text: data.message,
                timer: 2000,
                showConfirmButton: false
            }).then(() => {
                window.location.href = data.redirectUrl;
            });
        } else {
            Swal.fire({
                icon: 'error',
                title: 'Failed to place order',
                text: data.error || 'Please try again.'
            });
        }
    })
    .catch(err => {
        console.error(err);
        Swal.fire({
            icon: 'error',
            title: 'Server Error',
            text: 'Something went wrong while communicating with the server.'
        });
    });
}