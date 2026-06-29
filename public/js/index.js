

		document.addEventListener('DOMContentLoaded', () => {
			const searchInput = document.getElementById('searchInputIndex');
			const clearBtn = document.getElementById('clearBtnIndex');
			const searchForm = document.getElementById('searchFormIndex');
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
