

    const form = document.getElementById("addressForm");

    const fullName = document.getElementById("fullName");
    const phone = document.getElementById("phone");
    const house = document.getElementById("house");
    const area = document.getElementById("area");
    const city = document.getElementById("city");
    const state = document.getElementById("state");
    const pincode = document.getElementById("pincode");
    const addressType = document.getElementById("addressType");

    function clearErrors() {
        document.querySelectorAll(".error")
            .forEach(error => error.innerText = "");
    }

    function showError(id, message) {
        document.getElementById(id).innerText = message;
    }

    form.addEventListener("submit", (e) => {

        clearErrors();

        let isValid = true;

        // Name validation
        const nameRegex = /^[A-Za-z ]{3,50}$/;

        if (!nameRegex.test(fullName.value.trim())) {
            showError(
                "nameError",
                "Enter a valid full name"
            );
            isValid = false;
        }

        // Phone validation
        const phoneRegex = /^[6-9]\d{9}$/;

        if (!phoneRegex.test(phone.value.trim())) {
            showError(
                "phoneError",
                "Enter valid 10-digit phone number"
            );
            isValid = false;
        }

        // House
        if (house.value.trim() === "") {
            showError(
                "houseError",
                "House details required"
            );
            isValid = false;
        }

        // Area
        if (area.value.trim() === "") {
            showError(
                "areaError",
                "Area/Street required"
            );
            isValid = false;
        }

        // City
        if (city.value.trim() === "") {
            showError(
                "cityError",
                "City required"
            );
            isValid = false;
        }

        // State
        if (state.value.trim() === "") {
            showError(
                "stateError",
                "State required"
            );
            isValid = false;
        }

        // Pincode
        const pinRegex = /^\d{6}$/;

        if (!pinRegex.test(pincode.value.trim())) {
            showError(
                "pincodeError",
                "Enter valid 6-digit pincode"
            );
            isValid = false;
        }

        // Address type
        if (addressType.value === "") {
            showError(
                "typeError",
                "Select address type"
            );
            isValid = false;
        }

        if (!isValid) {
            e.preventDefault();
        }

    });

    // Live error removal
    const fields = [
        fullName,
        phone,
        house,
        area,
        city,
        state,
        pincode
    ];

    fields.forEach(field => {
        field.addEventListener("input", () => {
            clearErrors();
        });
    });

    

