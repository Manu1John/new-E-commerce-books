
		// Image Swapper Helper
		function changeImage(src, btn) {
			document.getElementById('mainProductImg').src = src;
			document.querySelectorAll('.thumbnail-btn').forEach(b => b.classList.remove('active'));
			btn.classList.add('active');
		}

		// Premium Magnifying hover Zoom logic
		const zoomBox = document.getElementById('mainZoom');
		const zoomImg = document.getElementById('mainProductImg');

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
