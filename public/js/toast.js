if (window.flashSuccess?.length) {

    Toastify({
        text: window.flashSuccess[0],
        duration: 3000,
        gravity: "top",
        position: "right",
        backgroundColor: "#28a745"
    }).showToast();

}

if (window.flashError?.length) {

    Toastify({
        text: window.flashError[0],
        duration: 3000,
        gravity: "top",
        position: "right",
        backgroundColor: "#dc3545"
    }).showToast();

}