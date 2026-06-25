
document.addEventListener("DOMContentLoaded", () => {

    const form = document.getElementById("categoryForm");
    const nameInput = document.getElementById("name");
    const descriptionInput = document.getElementById("description");

    const nameError = document.getElementById("nameError");
    const descriptionError = document.getElementById("descriptionError");

    form.addEventListener("submit", function (e) {

        let isValid = true;

        // Clear old errors
        nameError.textContent = "";
        descriptionError.textContent = "";

        const name = nameInput.value.trim();
        const description = descriptionInput.value.trim();

        // Name validation
        if (!name) {
            nameError.textContent =
                "Category name is required";
            isValid = false;
        } else if (name.length < 3) {
            nameError.textContent =
                "Category name must be at least 3 characters";
            isValid = false;
        } else if (!/^[a-zA-Z\s]+$/.test(name)) {
            nameError.textContent =
                "Only letters and spaces are allowed";
            isValid = false;
        }

        // Description validation
        if (!description) {
            descriptionError.textContent =
                "Description is required";
            isValid = false;
        } else if (description.length < 10) {
            descriptionError.textContent =
                "Description must be at least 10 characters";
            isValid = false;
        }

        if (!isValid) {
            e.preventDefault();
        }
    });

});

