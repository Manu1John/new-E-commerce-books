

		// Move item to cart (triggers cart add, which pulls it from wishlist automatically on the backend)
		function moveToCart(productId) {

    Swal.fire({
        title: "Are you sure?",
        text: "Do you want to move this item to the cart?",
        icon: "warning",
        showCancelButton: true,
        confirmButtonColor: "#3085d6",
        cancelButtonColor: "#d33",
        confirmButtonText: "Yes, move it!"
    }).then((result) => {

        if (result.isConfirmed) {

            fetch('/cart/add', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    productId: productId,
                    quantity: 1
                })
            })
            .then(res => res.json())
            .then(data => {

                if (data.success) {

                    Swal.fire({
                        title: "Done!",
                        text: "Your item has been moved to the cart.",
                        icon: "success"
                    });

                    const card = document.getElementById('product-card-' + productId);
                    if (card) card.remove();

                    document.querySelectorAll('.cart span').forEach(el => {
                        el.textContent = 'Cart: (' + data.cartCount + ')';
                    });

                    const container = document.getElementById('wishlist-container');
                    if (container && container.children.length === 0) {
                        window.location.reload();
                    }

                } else {

                    Swal.fire({
                        title: "Error!",
                        text: data.error || "Failed to move item to cart.",
                        icon: "error"
                    });

                }

            })
            .catch(err => {

                console.error(err);

                Swal.fire({
                    title: "Error!",
                    text: "Something went wrong.",
                    icon: "error"
                });

            });

        }

    });

}
		// Remove item from wishlist
		function removeFromWishlist(productId) {

    Swal.fire({
        title: "Are you sure?",
        text: "Do you want to remove this item from your wishlist?",
        icon: "warning",
        showCancelButton: true,
        confirmButtonColor: "#d33",
        cancelButtonColor: "#3085d6",
        confirmButtonText: "Yes, remove it!"
    }).then((result) => {

        if (result.isConfirmed) {

            fetch('/wishlist/remove', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    productId: productId
                })
            })
            .then(res => res.json())
            .then(data => {

                if (data.success) {

                    Swal.fire({
                        title: "Removed!",
                        text: "The item has been removed from your wishlist.",
                        icon: "success",
                        timer: 1500,
                        showConfirmButton: false
                    });

                    // Remove product card
                    const card = document.getElementById('product-card-' + productId);
                    if (card) card.remove();

                    // Reload if wishlist is empty
                    const container = document.getElementById('wishlist-container');
                    if (container && container.children.length === 0) {
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
