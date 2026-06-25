const signUpButton = document.getElementById('signUp');
const signInButton = document.getElementById('signIn');
const container = document.getElementById('container');

signUpButton.addEventListener('click', () => {
	container.classList.add("right-panel-active");
});

signInButton.addEventListener('click', () => {
	container.classList.remove("right-panel-active");
});

//password visiblity

function togglePasswordVisibility(inputId, icon) {
    const field = document.getElementById(inputId);

    if (field.type === "password") {
        field.type = "text";
        icon.classList.replace("fa-eye", "fa-eye-slash");
    } else {
        field.type = "password";
        icon.classList.replace("fa-eye-slash", "fa-eye");
    }
}



//validaton of signup page
document.querySelector(".sign-up-container form").addEventListener("submit",signupFormValidation)

function signupFormValidation(e){
    e.preventDefault()
    let firstName = document.getElementById("firstName").value.trim()
    let lastName = document.getElementById("lastName").value.trim()
    let email = document.getElementById("email").value.trim()
    let password = document.getElementById("password").value
    let confirmPassword = document.getElementById("confirmPassword").value
        const strongPassword =
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&]).{8,}$/

      let firstNameError = document.getElementById("firstNameError")
      let lastNameError = document.getElementById("lastNameError")
      let emailError = document.getElementById("emailError")
      let passwordError = document.getElementById("passwordError")
      let confirmPasswordError = document.getElementById("confirmpasswordError")

      //clear previous errors
      firstNameError.innerHTML = ""
      lastNameError.innerHTML = ""
      emailError.innerHTML = ""
      passwordError.innerHTML = ""
      confirmPasswordError.innerHTML = ""
      let isValid = true

      if(!firstName && !lastName && !email && !password ){
        firstNameError.innerHTML = "First Name is required"
        lastNameError.innerHTML = "Last Name is required"
        emailError.innerHTML = "Email is required"
        passwordError.innerHTML = "Password is required"
         isValid = false
      }else if(!lastName && ! email && !password){
        lastNameError.innerHTML = "Last Name is required"
        emailError.innerHTML = "Email is required"
        passwordError.innerHTML = "Password is required"
        isValid = false
      }else if(!email && !password){
        emailError.innerHTML = "Email is required"
        passwordError.innerHTML = "Password is required"
        isValid = false
      }else if(!password){
        passwordError.innerHTML = "Password is required"
        isValid = false
      }else if(!confirmPassword){
        confirmPasswordError.innerHTML = "Password is required"
        isValid = false
      } 
      if (password && !strongPassword.test(password)) {
      passwordError.textContent = "Password must be at least 8 characters long and include uppercase, lowercase, number, and special character."
      isValid = false
      
    } 
    if(password && confirmPassword && password !== confirmPassword){
        confirmPasswordError.innerHTML = "passwords are do not match!!"
        isValid = false
    }
if(isValid){
    e.target.submit()
}



}
document.querySelector(".sign-in-container form").addEventListener("submit",signinFormValidation)

function signinFormValidation(e){
  e.preventDefault()
  let loginEmail = document.getElementById("loginEmail").value.trim()
  let loginPassword = document.getElementById("loginPassword").value

  let loginEmailError = document.getElementById("loginEmailError")
  let loginPasswordError = document.getElementById("loginPasswordError")

  ///clear previous errors
  loginEmailError.innerHTML = ""
  loginPasswordError.innerHTML = ""

  let isValid = true;
  if(!loginEmail && !loginPassword){
    loginEmailError.innerHTML = "email is required"
    loginPasswordError.innerHTML = "password is required"
    isValid = false
  }else if(!loginPassword){
    loginPasswordError.innerHTML = "Password is required"
    isValid = false
  }
  if(isValid){
    e.target.submit()
  }

}

