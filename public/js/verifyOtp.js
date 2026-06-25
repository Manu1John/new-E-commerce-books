// Frontend Timer Logic

let timeLeft = 60; // 1 minute

const countdownElement =
    document.getElementById("countdown");

const resendBtn =
    document.getElementById("resendBtn");

// Disable button initially
resendBtn.disabled = true;

const countdown = setInterval(() => {

    timeLeft--;

    let minutes =
        Math.floor(timeLeft / 60);

    let seconds =
        timeLeft % 60;

    // Add leading zero
    if (seconds < 10) {
        seconds = "0" + seconds;
    }

    if (minutes < 10) {
        minutes = "0" + minutes;
    }

    // Update ONLY the span
    countdownElement.innerText =
        `${minutes}:${seconds}`;

    // When timer reaches zero
    if (timeLeft <= 0) {

        clearInterval(countdown);

        resendBtn.disabled = false;

        resendBtn.innerHTML =
            "Resend OTP Now";
    }

}, 1000);