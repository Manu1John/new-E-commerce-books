function showToast(message, type = "error") {
    Toastify({
        text: message,
        duration: 3000,
        gravity: "top",
        position: "right",
        close: true,
        stopOnFocus: true,
        style: {
            background: type === "success" ? "#16a34a" : "#dc2626"
        }
    }).showToast();
}

document.addEventListener("DOMContentLoaded", () => {
    const form = document.getElementById("categoryForm");

    const nameInput = document.getElementById("name");
    const descriptionInput = document.getElementById("description");

    form.addEventListener("submit", (e) => {
        const name = nameInput.value.trim();
        const description = descriptionInput.value.trim();

        // Name validation
        if (!name) {
            e.preventDefault();
            return showToast("Category name is required");
        }

        if (name.length < 3) {
            e.preventDefault();
            return showToast("Category name must be at least 3 characters");
        }

        if (!/^[a-zA-Z\s]+$/.test(name)) {
            e.preventDefault();
            return showToast("Only letters and spaces are allowed");
        }

        // Description validation
        if (!description) {
            e.preventDefault();
            return showToast("Description is required");
        }

        if (description.length < 10) {
            e.preventDefault();
            return showToast("Description must be at least 10 characters");
        }

        // If everything passes → form submits normally
    });

    
});