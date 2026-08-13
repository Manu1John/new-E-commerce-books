document.addEventListener('DOMContentLoaded', () => {
    const searchInput = document.getElementById('searchInputHome');
    const clearBtn = document.getElementById('clearBtnHome');
    const searchBtn = document.getElementById('searchBtnHome');
    const searchForm = document.getElementById('searchFormHome');
    let debounceTimer;

    if (searchInput && clearBtn && searchForm && searchBtn) {
        searchInput.addEventListener('input', (e) => {
            const hasText = e.target.value.trim().length > 0;
            // Toggle visibility between Clear and Search buttons
            clearBtn.style.display = hasText ? 'block' : 'none';
            searchBtn.style.display = hasText ? 'none' : 'block';
            
            clearTimeout(debounceTimer);
            debounceTimer = setTimeout(() => {
                searchForm.submit();
            }, 600); 
        });

        clearBtn.addEventListener('click', () => {
            searchInput.value = '';
            clearBtn.style.display = 'none';
            searchBtn.style.display = 'block'; // Bring back search button
            const url = new URL(window.location.href);
            url.searchParams.delete('search');
            window.location.href = url.pathname + url.search;
        });
    }

    // Auto-scroll to results immediately after searching or filtering
    const urlParams = new URLSearchParams(window.location.search);
    const hasFilters = urlParams.has('search') || urlParams.has('category') || urlParams.has('minPrice') || urlParams.has('sort');
    
    if (hasFilters && !window.location.hash) {
        const popularBooksSection = document.getElementById('popular-books');
        if (popularBooksSection) {
            setTimeout(() => {
                popularBooksSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }, 700);
        }
    }
});

const tabs = document.querySelectorAll('[data-tab-target]');
const tabContents = document.querySelectorAll('[data-tab-content]');
tabs.forEach(tab => {
    tab.addEventListener('click', () => {
        const target = document.querySelector(tab.dataset.tabTarget);
        tabContents.forEach(tabContent => {
            tabContent.classList.remove('active');
        });
        tabs.forEach(t => {
            t.classList.remove('active');
        });
        tab.classList.add('active');
        target.classList.add('active');
        
        const url = new URL(window.location.href);
        const targetId = tab.getAttribute('data-tab-target').replace('#', '');
        url.searchParams.set('activeTab', targetId);
        window.history.replaceState({}, '', url.pathname + url.search);
    });
});

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
             text:'Added item to the cart',
              icon: "success",
              draggable: true
            });
            // Update badge count
            document.querySelectorAll('.cart span').forEach(el => {
                el.textContent = 'Cart:(' + data.cartCount + ')';
            });
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
        // If server redirects due to auth middleware
        window.location.href = '/login';
    });
} // <--- FIX: Closed the addToCart function here!

async function addToWishlist(productId, buttonElement) {
    try {
        // Send POST request to your backend
        const response = await fetch('/wishlist/add', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ productId: productId })
        });

        const result = await response.json();

        if (result.success) {
            // Target the <i> tag inside the clicked button
            const icon = buttonElement.querySelector('i');
            
            // Toggle classes to make the heart solid and red
            icon.classList.remove('fa-regular', 'text-dark');
            icon.classList.add('fa-solid', 'text-danger'); 
            
            Swal.fire({
                toast: true,
                position: 'top-end',
                icon: 'success',
                title: 'Added to wishlist!',
                showConfirmButton: false,
                timer: 1500
            });
        } else {
            Swal.fire({
                toast: true,
                position: 'top-end',
                icon: 'error',
                title: result.error || 'Failed to add to wishlist',
                showConfirmButton: false,
                timer: 2000
            });
        }
    } catch (error) {
        console.error("Error adding to wishlist:", error);
    }
}