// 1. REMOVE the global selectedAddressId variable at the top entirely.

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
        alert('Please select a delivery address.');
        return;
    }

    // Extract the real ObjectId from the checked radio button
    const selectedAddressId = selectedRadio.value;

    // Send it to your backend
    fetch('/checkout/place', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ addressId: selectedAddressId })
    })
    .then(res => res.json())
    .then(data => {
        if (data.success) {
            alert(data.message);
            window.location.href = data.redirectUrl;
        } else {
            alert(data.error || 'Failed to place order.');
        }
    })
    .catch(err => console.error(err));
}