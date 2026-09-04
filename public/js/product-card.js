/* =======================================================
   PRODUCT CARD SHARED FUNCTIONS
   Used by the product-card.ejs partial across all pages.
   Provides: addToCart(), toggleWishlist()
======================================================= */

// Prevent duplicate declarations if this file is loaded alongside page-specific scripts
if (typeof window._productCardFunctionsLoaded === 'undefined') {
    window._productCardFunctionsLoaded = true;

    /**
     * Add a product to the cart.
     * Falls back to /login for unauthenticated users.
     */
    window.addToCart = async function addToCart(productId, quantity) {
        try {
            const response = await fetch('/cart/add', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ productId, quantity: quantity || 1 })
            });
            const data = await response.json();

            if (data.success) {
                Swal.fire({
                    title: 'Success!',
                    text: 'Item added to cart',
                    icon: 'success',
                    timer: 1500,
                    showConfirmButton: false
                });
                // Update all cart-count badges on the page
                document.querySelectorAll('.js-cart-count').forEach(el => {
                    el.textContent = data.cartCount;
                });
            } else {
                if (data.error === 'Unauthorized' || (data.error && data.error.includes && data.error.includes('log'))) {
                    window.location.href = '/login';
                } else {
                    Swal.fire({
                        title: 'Warning',
                        text: data.message || data.error || 'Could not add to cart',
                        icon: 'warning',
                        confirmButtonColor: '#212529'
                    });
                }
            }
        } catch (error) {
            console.error('addToCart error:', error);
            Swal.fire({
                title: 'Error',
                text: 'Something went wrong',
                icon: 'error',
                confirmButtonColor: '#212529'
            });
        }
    };

    /**
     * Toggle a product in the wishlist (add if not present, remove if already present).
     * Uses /wishlist/add  – the backend should handle duplicates gracefully.
     */
    window.toggleWishlist = async function toggleWishlist(productId, btnElement) {
        try {
            const response = await fetch('/wishlist/add', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ productId })
            });
            const data = await response.json();

            if (data.success) {
                const icon = btnElement ? btnElement.querySelector('i') : null;
                if (icon) {
                    // Toggle heart icon appearance
                    icon.classList.remove('fa-regular', 'text-dark', 'text-muted');
                    icon.classList.add('fa-solid', 'text-danger');
                }
                // Update wishlist count badges
                if (data.wishlistCount !== undefined) {
                    document.querySelectorAll('.js-wishlist-count').forEach(el => {
                        el.textContent = data.wishlistCount;
                    });
                }
                Swal.fire({
                    toast: true,
                    position: 'top-end',
                    icon: 'success',
                    title: 'Added to wishlist!',
                    showConfirmButton: false,
                    timer: 1500
                });
            } else {
                if (data.error === 'Unauthorized' || (data.error && data.error.includes && data.error.includes('log'))) {
                    window.location.href = '/login';
                } else {
                    Swal.fire({
                        toast: true,
                        position: 'top-end',
                        icon: 'info',
                        title: data.error || data.message || 'Already in wishlist',
                        showConfirmButton: false,
                        timer: 2000
                    });
                }
            }
        } catch (error) {
            console.error('toggleWishlist error:', error);
            Swal.fire({
                title: 'Error',
                text: 'Something went wrong',
                icon: 'error',
                confirmButtonColor: '#212529'
            });
        }
    };
}
