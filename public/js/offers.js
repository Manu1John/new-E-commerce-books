document.addEventListener('DOMContentLoaded', () => {
    document.addEventListener('click', async function (e) {
        const button = e.target.closest('.delete-offer-btn');
        if (!button) return; 

        e.preventDefault();

        const offerId = button.getAttribute('data-id');
        
        Swal.fire({
            title: 'Are you sure?',
            text: "Do you want to delete this offer? This action cannot be undone.",
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#ef4444',
            cancelButtonColor: '#64748b',
            confirmButtonText: 'Yes, delete it!',
            cancelButtonText: 'Cancel'
        }).then(async (result) => {
            if (result.isConfirmed) {
                try {
                    const response = await fetch(`/admin/offers/${offerId}`, {
                        method: 'DELETE',
                        headers: {
                            'Content-Type': 'application/json'
                        }
                    });

                    const data = await response.json();

                    if (response.ok && data.success) {
                        const Toast = Swal.mixin({
                            toast: true,
                            position: 'top-end',
                            showConfirmButton: false,
                            timer: 1500,
                            timerProgressBar: true
                        });

                        await Toast.fire({
                            icon: 'success',
                            title: data.message || 'Offer deleted successfully'
                        });

                        setTimeout(() => {
                            window.location.reload();
                        }, 1500);
                    } else {
                        Swal.fire({
                            icon: 'error',
                            title: 'Failed to delete',
                            text: data.message || "Unknown server error",
                            confirmButtonColor: '#2563eb'
                        });
                    }

                } catch (error) {
                    console.error("Deletion Fetch Error:", error);
                    Swal.fire({
                        icon: 'error',
                        title: 'Network Error',
                        text: 'A network error occurred while trying to delete the offer.',
                        confirmButtonColor: '#2563eb'
                    });
                }
            }
        });
    });
});