
        function updateCartCountBadge(count) {
            document.querySelectorAll('.js-cart-count').forEach(el => {
                el.textContent = count;
            });
            document.querySelectorAll('.js-cart-label').forEach(el => {
                el.textContent = `Cart:(${count})`;
            });
        }

        function markCartEmptyIfNeeded(count) {
            if (Number(count) !== 0) return;
            const table = document.querySelector('.cart-table');
            const checkoutCard = document.querySelector('.checkout-card');
            if (table) {
                table.closest('.col-lg-8').innerHTML = `
                    <div class="text-center py-5 border rounded bg-light">
                        <p class="text-muted mb-4" style="font-size: 1.2em;">Your shopping cart is currently empty.</p>
                        <a href="/home" class="btn btn-dark px-4 py-2" style="font-weight: 600;">Browse Books</a>
                    </div>
                `;
            }
            if (checkoutCard) {
                checkoutCard.querySelector('#summary-subtotal').textContent = '₹0';
                checkoutCard.querySelector('#summary-total').textContent = '₹0';
                const checkoutLink = checkoutCard.querySelector('a[href="/checkout"]');
                if (checkoutLink) {
                    checkoutLink.classList.add('disabled');
                    checkoutLink.setAttribute('aria-disabled', 'true');
                }
            }
        }

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
                    updateCartCountBadge(data.cartCount);
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

                            updateCartCountBadge(data.cartCount);

                            Swal.fire({
                                title: "Removed!",
                                text: "The item has been removed from your cart.",
                                icon: "success",
                                timer: 1500,
                                showConfirmButton: false
                            });

                            markCartEmptyIfNeeded(data.cartCount);
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

        function clearCart() {
            Swal.fire({
                title: "Clear cart?",
                text: "This will remove every item from your cart.",
                icon: "warning",
                showCancelButton: true,
                confirmButtonColor: "#d33",
                cancelButtonColor: "#3085d6",
                confirmButtonText: "Yes, clear it"
            }).then((result) => {
                if (!result.isConfirmed) return;

                fetch('/cart/clear', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' }
                })
                .then(res => res.json())
                .then(data => {
                    if (!data.success) {
                        Swal.fire("Error", data.error || "Failed to clear cart.", "error");
                        return;
                    }
                    document.querySelectorAll('.cart-table tbody tr').forEach(row => row.remove());
                    document.getElementById('summary-subtotal').textContent = '₹0';
                    document.getElementById('summary-total').textContent = '₹0';
                    updateCartCountBadge(0);
                    markCartEmptyIfNeeded(0);
                    Swal.fire({ title: "Cleared", text: "Your cart is empty.", icon: "success", timer: 1400, showConfirmButton: false });
                })
                .catch(err => {
                    console.error(err);
                    Swal.fire("Error", "Something went wrong. Please try again.", "error");
                });
            });
        }
