document.addEventListener("DOMContentLoaded", function () {

    // =====================================================
    // SEARCH
    // =====================================================

    const searchInput = document.getElementById("searchInput");
    const clearButton = document.getElementById("clearSearch");

    let searchTimer = null;

    if (searchInput) {

        searchInput.addEventListener("input", function () {

            clearTimeout(searchTimer);

            searchTimer = setTimeout(function () {

                const searchValue = searchInput.value.trim();

                if (searchValue !== "") {

                    window.location.href =
                        `/admin/users?search=${encodeURIComponent(searchValue)}`;

                } else {

                    window.location.href = "/admin/users";

                }

            }, 500);

        });
    }


    // =====================================================
    // CLEAR SEARCH
    // =====================================================

    if (clearButton) {

        clearButton.addEventListener("click", function (event) {

            event.preventDefault();

            window.location.href = "/admin/users";

        });
    }


    // =====================================================
    // TOAST CONTAINER
    // =====================================================

    const toastContainer = document.createElement("div");

    toastContainer.className = "toast-container";

    document.body.appendChild(toastContainer);


    // =====================================================
    // TOAST FUNCTION
    // =====================================================

    window.showToast = function (message, type = "success") {

        const toast = document.createElement("div");

        toast.className = `toast ${type}`;


        // Icon
        const icon = document.createElement("i");

        if (type === "success") {

            icon.className = "fa-solid fa-circle-check";

        } else if (type === "error") {

            icon.className = "fa-solid fa-circle-xmark";

        } else if (type === "warning") {

            icon.className = "fa-solid fa-triangle-exclamation";

        } else {

            icon.className = "fa-solid fa-circle-info";

        }


        // Message
        const messageElement = document.createElement("span");

        messageElement.textContent = message;


        // Add elements
        toast.appendChild(icon);
        toast.appendChild(messageElement);

        toastContainer.appendChild(toast);


        // Show animation
        setTimeout(function () {

            toast.classList.add("show");

        }, 10);


        // Remove toast
        setTimeout(function () {

            toast.classList.remove("show");

            setTimeout(function () {

                if (toast.parentNode) {
                    toast.remove();
                }

            }, 400);

        }, 3000);
    };




    // =====================================================
    // BLOCK / UNBLOCK USER
    // =====================================================

    const actionButtons =
        document.querySelectorAll(".action-btn");


    actionButtons.forEach(function (button) {

        button.addEventListener("click", function (event) {

            event.preventDefault();


            // ---------------------------------------------
            // Find the form
            // ---------------------------------------------

            const form = this.closest("form");

            if (!form) {

                console.error(
                    "Block/Unblock button is not inside a form."
                );

                return;
            }


            // ---------------------------------------------
            // Get user information
            // ---------------------------------------------

            const userName =
                this.getAttribute("data-name") || "this user";

            const action =
                this.getAttribute("data-action");


            // ---------------------------------------------
            // Determine block/unblock
            // ---------------------------------------------

            const isBlock = action === "block";


            const titleText = isBlock
                ? "Block User?"
                : "Unblock User?";


            const textContent = isBlock

                ? `Are you sure you want to block ${userName}? They will lose access to their account.`

                : `Are you sure you want to unblock ${userName}? They will regain access to their account.`;


            const confirmText = isBlock
                ? "Yes, block them"
                : "Yes, unblock them";


            const confirmColor = isBlock
                ? "#ef4444"
                : "#10b981";


            // ---------------------------------------------
            // Check SweetAlert
            // ---------------------------------------------

            if (typeof Swal === "undefined") {

                console.error(
                    "SweetAlert2 is not loaded."
                );

                // Fallback
                if (confirm(textContent)) {

                    form.submit();

                }

                return;
            }


            // ---------------------------------------------
            // SweetAlert Confirmation
            // ---------------------------------------------

            Swal.fire({

                title: titleText,

                text: textContent,

                icon: "warning",

                showCancelButton: true,

                confirmButtonColor: confirmColor,

                cancelButtonColor: "#64748b",

                confirmButtonText: confirmText,

                cancelButtonText: "Cancel",

                reverseButtons: true,

                allowOutsideClick: false,

                allowEscapeKey: true,

                customClass: {

                    popup: "user-action-popup"

                }

            }).then(function (result) {

                if (result.isConfirmed) {

                    // -------------------------------------
                    // Submit original form
                    // -------------------------------------

                    form.submit();

                }

            });

        });

    });


    // =====================================================
    // OPTIONAL: SHOW SERVER-SIDE TOAST MESSAGE
    // =====================================================

    /*
        If your controller sends:

        res.redirect("/admin/users?success=User blocked");

        then you can display the message here.
    */

    const urlParams =
        new URLSearchParams(window.location.search);

    const successMessage =
        urlParams.get("success");

    const errorMessage =
        urlParams.get("error");


    if (successMessage) {

        window.showToast(
            successMessage,
            "success"
        );

    }


    if (errorMessage) {

        window.showToast(
            errorMessage,
            "error"
        );

    }

});