
		document.addEventListener('DOMContentLoaded', () => {
			const searchInput = document.getElementById('searchInputHome');
			const clearBtn = document.getElementById('clearBtnHome');
			const searchForm = document.getElementById('searchFormHome');
			let debounceTimer;

			if (searchInput && clearBtn && searchForm) {
				searchInput.addEventListener('input', (e) => {
					clearBtn.style.display = e.target.value.trim() ? 'block' : 'none';
					clearTimeout(debounceTimer);
					debounceTimer = setTimeout(() => {
						searchForm.submit();
					}, 600); 
				});

				clearBtn.addEventListener('click', () => {
					searchInput.value = '';
					clearBtn.style.display = 'none';
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
					}, 100);
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
		} 
