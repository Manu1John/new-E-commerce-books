// ELEMENTS
const searchInput =
    document.getElementById(
        "searchInput"
    );

const clearButton =
    document.getElementById(
        "clearButton"
    );

let timer;


// SEARCH PRODUCT
if (searchInput) {

    searchInput.addEventListener(
        "keyup",
        function () {

            clearTimeout(timer);

            timer =
                setTimeout(() => {

                    const value =
                        searchInput.value.trim();

                    window.location.href =
                        `/admin/products?search=${value}`;

                }, 500);
        }
    );
}


// CLEAR SEARCH
if (clearButton) {

    clearButton.addEventListener(
        "click",
        () => {

            searchInput.value = "";

            window.location.href =
                "/admin/products";
        }
    );
}