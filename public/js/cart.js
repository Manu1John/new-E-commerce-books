
        // AJAX quantity increment/decrement helper
        function updateQty(productId, action) {
            fetch('/cart/update', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ productId, action })
            })
            .then(res => res.json())
            .then(data => {
                if (data.success) {
                    // Update display numbers dynamically
                    document.getElementById('qty-' + productId).value = data.quantity;
                    document.getElementById('total-' + productId).textContent = '₹' + data.itemTotal;
                    document.getElementById('summary-subtotal').textContent = '₹' + data.cartSubtotal;
                    document.getElementById('summary-total').textContent = '₹' + data.cartSubtotal;
                    
                    // Update navbar count seamlessly
                    document.querySelectorAll('.cart span').forEach(el => {
                        el.textContent = 'Cart:(' + data.cartCount + ')';
                    });
                } else {
                    // FIX: Replaced crude alert() dialog with a cohesive SweetAlert modal matching design aesthetics
                    Swal.fire({
                        title: "Notice",
                        text: data.error || 'Failed to update quantity.',
                        icon: "info"
                    });
                }
            })
            .catch(err => console.error(err));
        }

        // AJAX remove item helper
        function removeItem(productId) {
            if (!productId) {
                Swal.fire({
                    title: "Error!",
                    text: "Cannot remove an already deleted product. Please clear your cart.",
                    icon: "error"
                });
                return;
            }

            Swal.fire({
                title: "Are you sure?",
                text: "Do you want to remove this item from your cart?",
                icon: "warning",
                showCancelButton: true,
                confirmButtonColor: "#d33",
                cancelButtonColor: "#3085d6",
                confirmButtonText: "Yes, remove it!"
            }).then((result) => {
                if (result.isConfirmed) {
                    fetch('/cart/remove', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ productId: productId })
                    })
                    .then(res => res.json())
                    .then(data => {
                        if (data.success) {
                            const row = document.getElementById('row-' + productId);
                            if (row) row.remove();

                            document.getElementById('summary-subtotal').textContent = '₹' + data.cartSubtotal;
                            document.getElementById('summary-total').textContent = '₹' + data.cartSubtotal;

                            document.querySelectorAll('.cart span').forEach(el => {
                                el.textContent = 'Cart:(' + data.cartCount + ')';
                            });

                            Swal.fire({
                                title: "Removed!",
                                text: "The item has been removed from your cart.",
                                icon: "success",
                                timer: 1500,
                                showConfirmButton: false
                            });

                            if (data.cartCount === 0) {
                                setTimeout(() => {
                                    window.location.reload();
                                }, 1500);
                            }
                        } else {
                            Swal.fire({
                                title: "Error!",
                                text: data.error || "Failed to remove the item.",
                                icon: "error"
                            });
                        }
                    })
                    .catch(err => {
                        console.error(err);
                        Swal.fire({
                            title: "Error!",
                            text: "Something went wrong. Please try again.",
                            icon: "error"
                        });
                    });
                }
            });
        }
