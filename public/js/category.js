// =========================
// SEARCH (CATEGORY ONLY)
// =========================

const searchInput = document.getElementById("searchInput");

let timer;

if (searchInput) {
    searchInput.addEventListener("keyup", function () {

        clearTimeout(timer);

        timer = setTimeout(() => {

            const value = searchInput.value.trim();

            window.location.href =
                `/admin/category?search=${encodeURIComponent(value)}`;

        }, 500);

    });
}


// =========================
// DELETE MODAL LOGIC
// =========================

let selectedId = null;

const modal = document.getElementById("deleteModal");
const cancelBtn = document.getElementById("cancelDelete");
const confirmBtn = document.getElementById("confirmDelete");

function openDeleteModal(id) {
    selectedId = id;
    if (modal) modal.style.display = "flex";
}

function closeModal() {
    selectedId = null;
    if (modal) modal.style.display = "none";
}

// expose to HTML
window.openDeleteModal = openDeleteModal;

if (cancelBtn) {
    cancelBtn.addEventListener("click", closeModal);
}

if (confirmBtn) {
    confirmBtn.addEventListener("click", async function () {

        if (!selectedId) return;

        try {

            const response = await fetch(
                `/admin/category/${selectedId}/delete`,
                {
                    method: "DELETE",
                    headers: {
                        "Content-Type": "application/json"
                    }
                }
            );

            const data = await response.json();

            if (response.ok && data.success) {
                showToast("Category deleted successfully!", "success");
                closeModal();
                setTimeout(() => location.reload(), 800);
            } else {
                showToast(data.message || "Delete failed", "error");
            }

        } catch (err) {
            console.error(err);
            showToast("Server error", "error");
        }

    });
}


// =========================
// TOAST
// =========================

function showToast(message, type = "success") {
    Toastify({
        text: message,
        duration: 3000,
        close: true,
        gravity: "top",
        position: "right",
        backgroundColor:
            type === "success" ? "#28a745" : "#dc3545",
    }).showToast();
}