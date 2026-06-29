

        let selectedAddressId = '<%= addresses.length > 0 ? addresses[0]._id : "" %>';

        function selectAddress(element, addressId) {
            document.querySelectorAll('.address-card').forEach(card => card.classList.remove('selected'));
            element.classList.add('selected');
            element.querySelector('input[type="radio"]').checked = true;
            selectedAddressId = addressId;
        }

        function placeOrder() {
            if (!selectedAddressId) {
                alert('Please select a delivery address.');
                return;
            }

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
