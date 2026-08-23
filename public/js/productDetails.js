// Image Swapper Helper
function changeImage(src, btn) {
    document.getElementById('mainProductImg').src = src;
    document.querySelectorAll('.thumbnail-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
}

// Premium Magnifying hover Zoom logic
const zoomBox = document.getElementById('mainZoom');
const zoomImg = document.getElementById('mainProductImg');

if (zoomBox && zoomImg) {
    zoomBox.addEventListener('mousemove', (e) => {
        const rect = zoomBox.getBoundingClientRect();
        const x = ((e.clientX - rect.left) / rect.width) * 100;
        const y = ((e.clientY - rect.top) / rect.height) * 100;
        zoomImg.style.transformOrigin = `${x}% ${y}%`;
        zoomImg.style.transform = 'scale(2.2)';
    });

    zoomBox.addEventListener('mouseleave', () => {
        zoomImg.style.transform = 'scale(1)';
    });
}

function updateCartCountBadge(count) {
    document.querySelectorAll('.js-cart-count').forEach(el => {
        el.textContent = count;
    });
    document.querySelectorAll('.js-cart-label').forEach(el => {
        el.textContent = `Cart:(${count})`;
    });
}

// Dynamic actions (AJAX Cart/Wishlist calls)
function addToCart(productId) {
    fetch('/cart/add', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ productId, quantity: 1 })
    })
    .then(res => res.json())
    .then(data => {
        if (data.success) {
            Swal.fire({
            position: "top-end",
            icon: "success",
            title: "Your item has been moved to the cart",
            showConfirmButton: false,
            timer: 1500
            });
            updateCartCountBadge(data.cartCount);
        } else {
            if (data.error === "Unauthorized" || !data.success && data.error && data.error.includes("log")) {
                window.location.href = '/login';
            } else {
                alert(data.error || 'Failed to add item to cart.');
            }
        }
    })
    .catch(err => {
        console.error(err);
        window.location.href = '/login';
    });
}

function addToWishlist(productId) {
    fetch('/wishlist/add', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ productId })
    })
    .then(res => res.json())
    .then(data => {
        if (data.success) {
            Swal.fire({
            title: "item added to the wishlist !",
            icon: "success",
            draggable: true
            });
        } else {
            alert(data.error || 'Failed to add to wishlist.');
        }
    })
    .catch(err => {
        window.location.href = '/login';
    });
}

// --- REVIEW LOGIC ---
document.addEventListener('DOMContentLoaded', () => {
    const ratingStars = document.querySelectorAll('.rating-select i');
    const ratingInput = document.getElementById('ratingInput');
    const reviewForm = document.getElementById('reviewForm');
    let reviewModal;
    
    // Check if the modal element exists before initializing
    const modalElement = document.getElementById('reviewModal');
    if (modalElement) {
        reviewModal = new bootstrap.Modal(modalElement);
    }

    // Star Rating Hover & Click
    ratingStars.forEach(star => {
        star.addEventListener('click', (e) => {
            const rating = e.target.getAttribute('data-rating');
            ratingInput.value = rating;
            updateStarUI(rating);
        });
    });

    function updateStarUI(rating) {
        ratingStars.forEach(star => {
            if (star.getAttribute('data-rating') <= rating) {
                star.classList.replace('far', 'fas');
                star.classList.add('text-warning');
            } else {
                star.classList.replace('fas', 'far');
                star.classList.remove('text-warning');
            }
        });
    }

    // Expose openEditModal globally for the EJS onclick handler
    window.openEditModal = function(reviewId, rating, comment) {
        document.getElementById('reviewModalTitle').innerText = 'Edit Review';
        document.getElementById('reviewId').value = reviewId;
        document.getElementById('commentInput').value = comment;
        ratingInput.value = rating;
        updateStarUI(rating);
        if (reviewModal) reviewModal.show();
    };

    // Handle Submit (Create/Update)
    if(reviewForm) {
        reviewForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const reviewId = document.getElementById('reviewId').value;
            
            // Check if rating is selected
            if(!ratingInput.value) {
                Swal.fire({ icon: 'warning', title: 'Rating Required', text: 'Please select a star rating.' });
                return;
            }

            const payload = {
                productId: document.getElementById('productId').value,
                rating: ratingInput.value,
                comment: document.getElementById('commentInput').value
            };

            const url = reviewId ? `/review/edit/${reviewId}` : '/review/add';
            const method = reviewId ? 'PUT' : 'POST'; // Assuming backend handles PUT or POST appropriately

            try {
                const response = await fetch(url, {
                    method: method,
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload)
                });
                const data = await response.json();

                if (data.success) {
                    await Swal.fire({ icon: 'success', title: data.message, showConfirmButton: false, timer: 1500 });
                    window.location.reload();
                } else {
                    Swal.fire({ icon: 'error', title: 'Oops...', text: data.error });
                }
            } catch (error) {
                Swal.fire({ icon: 'error', title: 'Error', text: 'Something went wrong.' });
            }
        });
    }

    // Handle Delete
    window.deleteReview = function(reviewId) {
        Swal.fire({
            title: 'Are you sure?',
            text: "You won't be able to revert this!",
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#d33',
            cancelButtonColor: '#3085d6',
            confirmButtonText: 'Yes, delete it!'
        }).then(async (result) => {
            if (result.isConfirmed) {
                try {
                    const response = await fetch(`/review/delete/${reviewId}`, { method: 'DELETE' });
                    const data = await response.json();
                    if (data.success) {
                        await Swal.fire('Deleted!', 'Your review has been deleted.', 'success');
                        window.location.reload();
                    } else {
                        Swal.fire('Error!', data.error, 'error');
                    }
                } catch (error) {
                    Swal.fire('Error!', 'Something went wrong.', 'error');
                }
            }
        });
    };
});