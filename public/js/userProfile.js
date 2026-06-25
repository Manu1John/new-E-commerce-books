
    const editBtn =
        document.getElementById("editBtn");

    const changePhotoBtn =
        document.getElementById(
            "changePhotoBtn"
        );

    const profileImage =
        document.getElementById(
            "profileImage"
        );

    const previewImage =
        document.getElementById(
            "previewImage"
        );

    // ALL editable fields
    const fields =
        document.querySelectorAll(
            'input[name="firstName"], input[name="lastName"], input[name="phone"], textarea[name="address"]'
        );

    let editMode = false;

    editBtn.addEventListener(
        "click",
        function () {

            // SAVE MODE
            if (editMode) {

                document
                    .querySelector(
                        ".info-card"
                    )
                    .submit();

                return;
            }

            // EDIT MODE
            fields.forEach(
                field => {
                    field.disabled = false;
                }
            );

            changePhotoBtn.disabled =
                false;

            editBtn.textContent =
                "Save";

            editMode = true;
        }
    );

    // Open image picker
    changePhotoBtn
        .addEventListener(
            "click",
            () => {
                profileImage.click();
            }
        );

    // Preview selected image
    profileImage
        .addEventListener(
            "change",
            function () {

                const file =
                    this.files[0];

                if (file) {

                    previewImage.src =
                        URL.createObjectURL(
                            file
                        );
                }
            }
        );


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
    // FIXED: Removed .trim() so frontend evaluation mirrors exactly what the form transmits
    const password = passwordInput.value;
    const confirmPassword = confirmPasswordInput.value;

    // Password Evaluation Logic
    const hasLength = password.length >= 8;
    const hasUpper = /[A-Z]/.test(password);
    const hasLower = /[a-z]/.test(password);
    const hasNumber = /[0-9]/.test(password);
    const hasSpecial = /[!@#$%^&*(),.?":{}|<>]/.test(password);

    // Update UI Rules (Safe execution via updated function)
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
    // FIXED: Guard clause prevents script crashes if an element is missing from the DOM
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

//password visiblity
document.getElementById("passwordShow").addEventListener("click",toggleVissiblity)
const currentPassword = document.getElementById("currentPassword")
const newPassword = document.getElementById("newPassword")
const confirmPassword = document.getElementById("confirmPassword")
function toggleVissiblity(){
    if(currentPassword.type === "password" && newPassword.type==="password" 
        &&confirmPassword.type === "password"){
            currentPassword.type ="text"
            newPassword.type = "text"
            confirmPassword.type ="text"
    }else{
         currentPassword.type ="password"
            newPassword.type = "password"
            confirmPassword.type ="password"
    } 
}

// PASSWORD TOGGLE
const togglePasswordBtn =
    document.getElementById(
        "togglePasswordBtn"
    );

const passwordFormContainer =
    document.getElementById(
        "passwordFormContainer"
    );

togglePasswordBtn?.addEventListener(
    "click",
    () => {

        passwordFormContainer
            .style.display =
            passwordFormContainer
                .style.display ===
            "none"
                ? "block"
                : "none";
    }
);

// EMAIL TOGGLE
const toggleEmailBtn =
    document.getElementById(
        "toggleEmailBtn"
    );

const emailFormContainer =
    document.getElementById(
        "emailFormContainer"
    );

toggleEmailBtn?.addEventListener(
    "click",
    () => {

        emailFormContainer
            .style.display =
            emailFormContainer
                .style.display ===
            "none"
                ? "block"
                : "none";
    }
);