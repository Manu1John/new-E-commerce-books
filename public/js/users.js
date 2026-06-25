document.addEventListener("DOMContentLoaded", () => {
    const searchInput = document.getElementById("searchInput");
    const clearButton = document.getElementById("clearSearch");
    let timer;

    // Debounced search
    if (searchInput) {
        searchInput.addEventListener("keyup", function () {
            clearTimeout(timer);
            timer = setTimeout(() => {
                const searchValue = searchInput.value.trim();
                window.location.href = `/admin/users?search=${searchValue}`;
            }, 500);
        });
    }

    // Clear search
    if (clearButton) {
        clearButton.addEventListener("click", function () {
            window.location.href = "/admin/users";
        });
    }

    // --- NEW TOAST & CUSTOM CONFIRMATION LOGIC ---

    // Automatically build & inject Toast container into DOM
    const toastContainer = document.createElement('div');
    toastContainer.className = 'toast-container';
    document.body.appendChild(toastContainer);

    // Toast Generator Function
    window.showToast = function(message, type = 'success') {
        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        
        const iconClass = type === 'success' ? 'fa-solid fa-circle-check' : 'fa-solid fa-circle-xmark';
        
        toast.innerHTML = `
            <i class="${iconClass}"></i>
            <span>${message}</span>
        `;
        
        toastContainer.appendChild(toast);
        
        // Trigger presentation transitions
        setTimeout(() => toast.classList.add('show'), 10);
        
        // Auto remove layout
        setTimeout(() => {
            toast.classList.remove('show');
            setTimeout(() => toast.remove(), 400);
        }, 3000);
    }

    // Custom Pop-up Confirmation Modal Generator Function
    function showCustomConfirm(message, onConfirm) {
        const overlay = document.createElement('div');
        overlay.className = 'confirm-overlay';
        overlay.innerHTML = `
            <div class="confirm-box">
                <h3>Confirm Action</h3>
                <p>${message}</p>
                <div class="confirm-buttons">
                    <button class="confirm-btn no">Cancel</button>
                    <button class="confirm-btn yes">Confirm</button>
                </div>
            </div>
        `;
        document.body.appendChild(overlay);
        
        setTimeout(() => overlay.classList.add('show'), 10);

        const closeConfirm = () => {
            overlay.classList.remove('show');
            setTimeout(() => overlay.remove(), 300);
        };

        overlay.querySelector('.confirm-btn.no').addEventListener('click', closeConfirm);
        overlay.querySelector('.confirm-btn.yes').addEventListener('click', () => {
            closeConfirm();
            onConfirm();
        });
    }

    // Intercept User Block/Unblock Form Submissions
    document.querySelectorAll('.status-form').forEach(form => {
        form.addEventListener('submit', function(e) {
            e.preventDefault(); // Stop standard direct page reloads
            
            const confirmationMessage = this.getAttribute('data-message') || 'Are you sure you want to proceed?';
            
            showCustomConfirm(confirmationMessage, async () => {
                try {
                    const response = await fetch(this.action, {
                        method: 'POST', // Handled via _method=PATCH parsing
                        headers: {
                            'Content-Type': 'application/x-www-form-urlencoded'
                        }
                    });

                    if (response.ok) {
                        showToast('Status updated successfully!', 'success');
                        // Delays reload briefly so the user experiences the beautiful success toast
                        setTimeout(() => {
                            window.location.reload();
                        }, 1300);
                    } else {
                        showToast('Failed to update status. Please try again.', 'error');
                    }
                } catch (error) {
                    console.error('Error handling status change:', error);
                    showToast('A network error occurred.', 'error');
                }
            });
        });
    });
});