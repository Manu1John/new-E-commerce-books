// Frontend Timer Logic
const countdownElement = document.getElementById("countdown");
const resendBtn = document.getElementById("resendBtn");

// Disable button initially
resendBtn.disabled = true;

// 1. Check if we already have an expiration time saved in sessionStorage
let expiryTime = sessionStorage.getItem("otpExpiryTime");

if (!expiryTime) {
    // If not, calculate the time 60 seconds from now and save it
    expiryTime = new Date().getTime() + 60000;
    sessionStorage.setItem("otpExpiryTime", expiryTime);
}

const countdown = setInterval(() => {
    
    // 2. Calculate remaining time based on the fixed expiry time
    const now = new Date().getTime();
    const timeLeft = Math.floor((expiryTime - now) / 1000);

    // When timer reaches zero
    if (timeLeft <= 0) {
        clearInterval(countdown);
        
        // Clean up the storage so a new timer can start later
        sessionStorage.removeItem("otpExpiryTime"); 

        resendBtn.disabled = false;
        resendBtn.innerHTML = "Resend OTP Now";
        countdownElement.innerText = "00:00";
    } else {
        // 3. Update the UI
        let minutes = Math.floor(timeLeft / 60);
        let seconds = timeLeft % 60;

        // Add leading zero
        if (seconds < 10) {
            seconds = "0" + seconds;
        }
        if (minutes < 10) {
            minutes = "0" + minutes;
        }

        // Update ONLY the span
        countdownElement.innerText = `${minutes}:${seconds}`;
    }

}, 1000);

// 4. Ensure clicking "Resend OTP" clears the old timer
resendBtn.addEventListener("click", () => {
    sessionStorage.removeItem("otpExpiryTime");
});