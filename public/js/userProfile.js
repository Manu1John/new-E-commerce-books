const editBtn = document.getElementById("editBtn");
const changePhotoBtn = document.getElementById("changePhotoBtn");
const profileImage = document.getElementById("profileImage");
const previewImage = document.getElementById("previewImage");

// ALL editable fields
const fields = document.querySelectorAll(
    'input[name="firstName"], input[name="lastName"], input[name="phone"], textarea[name="address"]'
);

let editMode = false;

editBtn.addEventListener("click", function () {
    // SAVE MODE
    if (editMode) {
        // FIX: Use requestSubmit() instead of submit() to trigger the form's submit event listener
        document.querySelector(".info-card").requestSubmit();
        return;
    }

    // EDIT MODE
    fields.forEach(field => {
        field.disabled = false;
    });

    changePhotoBtn.disabled = false;
    editBtn.textContent = "Save";
    editMode = true;
});

// Open image picker
changePhotoBtn.addEventListener("click", () => {
    profileImage.click();
});

// Preview selected image
profileImage.addEventListener("change", function () {
    const file = this.files[0];
    if (file) {
        previewImage.src = URL.createObjectURL(file);
    }
});


// CHANGE PASSWORD LIVE VALIDATION
const passwordInput = document.getElementById("newPassword");
const confirmPasswordInput = document.getElementById("confirmPassword");
const submitBtn = document.getElementById("passwordBtn");

// Rules elements
const lengthRule = document.getElementById("lengthRule");
const upperRule = document.getElementById("upperRule");
const lowerRule = document.getElementById("lowerRule");
const numberRule = document.getElementById("numberRule");
const specialRule = document.getElementById("specialRule");
const confirmPasswordError = document.getElementById("confirmPasswordError");

// Safe Guard Initialization
if (passwordInput && confirmPasswordInput && submitBtn) {
    submitBtn.disabled = true;

    passwordInput.addEventListener("input", validatePassword);
    confirmPasswordInput.addEventListener("input", validatePassword);
}

function validatePassword() {
    const password = passwordInput.value;
    const confirmPassword = confirmPasswordInput.value;

    // Password Evaluation Logic
    const hasLength = password.length >= 8;
    const hasUpper = /[A-Z]/.test(password);
    const hasLower = /[a-z]/.test(password);
    const hasNumber = /[0-9]/.test(password);
    const hasSpecial = /[!@#$%^&*(),.?":{}|<>]/.test(password);

    // Update UI Rules
    updateRule(lengthRule, hasLength);
    updateRule(upperRule, hasUpper);
    updateRule(lowerRule, hasLower);
    updateRule(numberRule, hasNumber);
    updateRule(specialRule, hasSpecial);

    // Confirm Password Check
    if (confirmPassword && password !== confirmPassword) {
        if (confirmPasswordError) confirmPasswordError.innerText = "Passwords do not match";
    } else {
        if (confirmPasswordError) confirmPasswordError.innerText = "";
    }

    // Final Evaluation State
    const isPasswordValid =
        hasLength &&
        hasUpper &&
        hasLower &&
        hasNumber &&
        hasSpecial &&
        password === confirmPassword;

    submitBtn.disabled = !isPasswordValid;
}

function updateRule(element, isValid) {
    if (!element) return; 

    const icon = element.querySelector(".icon");

    if (isValid) {
        element.classList.add("valid");
        element.classList.remove("invalid");
        if (icon) icon.innerText = "✅";
    } else {
        element.classList.add("invalid");
        element.classList.remove("valid");
        if (icon) icon.innerText = "❌";
    }
}

// Password visibility
document.getElementById("passwordShow").addEventListener("click", toggleVissiblity);
const currentPassword = document.getElementById("currentPassword");
const newPassword = document.getElementById("newPassword");
const confirmPassword = document.getElementById("confirmPassword");

function toggleVissiblity(){
    if(currentPassword.type === "password" && newPassword.type === "password" && confirmPassword.type === "password"){
        currentPassword.type ="text";
        newPassword.type = "text";
        confirmPassword.type ="text";
    } else {
        currentPassword.type ="password";
        newPassword.type = "password";
        confirmPassword.type ="password";
    } 
}

// PASSWORD TOGGLE
const togglePasswordBtn = document.getElementById("togglePasswordBtn");
const passwordFormContainer = document.getElementById("passwordFormContainer");

togglePasswordBtn?.addEventListener("click", () => {
    passwordFormContainer.style.display = passwordFormContainer.style.display === "none" ? "block" : "none";
});

// EMAIL TOGGLE
const toggleEmailBtn = document.getElementById("toggleEmailBtn");
const emailFormContainer = document.getElementById("emailFormContainer");

toggleEmailBtn?.addEventListener("click", () => {
    emailFormContainer.style.display = emailFormContainer.style.display === "none" ? "block" : "none";
});


// PROFILE LIVE VALIDATION
const firstName = document.getElementById("firstName");
const lastName = document.getElementById("lastName");
const phone = document.getElementById("phone");

const firstNameError = document.getElementById("firstNameError");
const lastNameError = document.getElementById("lastNameError");
const phoneError = document.getElementById("phoneError");

const nameRegex = /^[A-Za-z\s'-]+$/;
const phoneRegex = /^[6-9]\d{9}$/;

function validateFirstName() {
    const value = firstName.value.trim();

    if (value === "") {
        firstNameError.textContent = "First name is required.";
        return false;
    }

    if (value.length < 2) {
        firstNameError.textContent = "Minimum 2 characters required.";
        return false;
    }

    if (!nameRegex.test(value)) {
        firstNameError.textContent = "Only letters, spaces, apostrophes and hyphens are allowed.";
        return false;
    }

    firstNameError.textContent = "";
    return true;
}

function validateLastName() {
    const value = lastName.value.trim();

    if (value === "") {
        lastNameError.textContent = "Last name is required.";
        return false;
    }

    if (!nameRegex.test(value)) {
        lastNameError.textContent = "Only letters, spaces, apostrophes and hyphens are allowed.";
        return false;
    }

    lastNameError.textContent = "";
    return true;
}

function validatePhone() {
    const value = phone.value.trim();

    if (value === "") {
        phoneError.textContent = "Phone number is required.";
        return false;
    }

    if (!phoneRegex.test(value)) {
        phoneError.textContent = "Enter a valid 10-digit Indian mobile number.";
        return false;
    }

    phoneError.textContent = "";
    return true;
}

firstName.addEventListener("input", validateFirstName);
lastName.addEventListener("input", validateLastName);
phone.addEventListener("input", validatePhone);

document.querySelector(".info-card").addEventListener("submit", function (e) {
    const valid =
        validateFirstName() &&
        validateLastName() &&
        validatePhone();

    if (!valid) {
        e.preventDefault();
    }
});