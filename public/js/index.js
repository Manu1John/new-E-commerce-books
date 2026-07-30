document.addEventListener('DOMContentLoaded', () => {
    const searchInput = document.getElementById('searchInputIndex');
    const clearBtn = document.getElementById('clearBtnIndex');
    const searchBtn = document.getElementById('searchBtnIndex');
    const searchForm = document.getElementById('searchFormIndex');
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