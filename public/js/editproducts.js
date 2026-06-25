console.log("==== EDIT PRODUCTS SCRIPT IS ALIVE! ====");
document.addEventListener('DOMContentLoaded', () => {
    const form = document.querySelector('form');
    const dropArea = document.getElementById('dropArea');
    const imageUpload = document.getElementById('imageUpload');
    const previewContainer = document.getElementById('previewContainer');
    
    // Core data structure to manage newly added images
    let imageArray = []; 

    if (!dropArea || !imageUpload || !form) {
        console.error("Critical DOM elements missing. Check your HTML IDs!");
        return;
    }

    // --- 📸 IMAGE SELECTION & CROPPER MODAL LOGIC ---
    dropArea.addEventListener('click', () => imageUpload.click());

    imageUpload.addEventListener('change', function(e) {
        const files = e.target.files;
        
        // Enforce limits ONLY if they choose to pick new files
        if (files.length > 0 && (files.length < 3 || files.length > 5)) {
            alert('If uploading new images, please select between 3 and 5 files.');
            this.value = '';
            previewContainer.innerHTML = '';
            imageArray = [];
            return;
        }

        previewContainer.innerHTML = '';
        imageArray = [];

        Array.from(files).forEach((file, index) => {
            if (!file.type.startsWith('image/')) return;
            const reader = new FileReader();
            reader.onload = (event) => {
                imageArray.push({
                    originalSrc: event.target.result,
                    croppedBlob: null,
                    filename: file.name
                });
                renderThumbnails();
            };
            reader.readAsDataURL(file);
        });
    });

    function renderThumbnails() {
        previewContainer.innerHTML = '';
        imageArray.forEach((item, index) => {
            const card = document.createElement('div');
            card.style.cssText = 'position:relative; display:inline-block; margin:15px; width:150px; text-align:center; border:1px solid #ddd; padding:5px; border-radius:6px; background:#fff;';

            const img = document.createElement('img');
            img.src = item.croppedBlob ? URL.createObjectURL(item.croppedBlob) : item.originalSrc;
            img.style.cssText = 'width:100%; height:150px; object-fit:cover; border-radius:4px;';
            
            const cropBtn = document.createElement('button');
            cropBtn.type = 'button';
            cropBtn.innerText = item.croppedBlob ? '📊 Re-Crop' : '✂️ Crop Image';
            cropBtn.style.cssText = 'margin-top:8px; width:100%; padding:6px; background:#4f46e5; color:#fff; border:none; border-radius:4px; cursor:pointer; font-size:12px;';
            cropBtn.addEventListener('click', () => openCropModal(index));

            card.appendChild(img);
            card.appendChild(cropBtn);
            previewContainer.appendChild(card);
        });
    }

    function openCropModal(index) {
        const item = imageArray[index];
        const modalOverlay = document.createElement('div');
        modalOverlay.style.cssText = 'position:fixed; top:0; left:0; width:100%; height:100%; background:rgba(0,0,0,0.8); z-index:99999; display:flex; flex-direction:column; align-items:center; justify-content:center;';

        const cropContainer = document.createElement('div');
        cropContainer.style.cssText = 'max-width:500px; max-height:500px; background:#fff; padding:10px; border-radius:8px;';

        const img = document.createElement('img');
        img.src = item.originalSrc;
        img.style.cssText = 'max-width:100%; display:block;';

        const actionWrapper = document.createElement('div');
        actionWrapper.style.cssText = 'margin-top:15px; display:flex; gap:10px; justify-content:end; width:100%; max-width:500px;';

        const cancelBtn = document.createElement('button');
        cancelBtn.type = 'button';
        cancelBtn.innerText = 'Cancel';
        cancelBtn.style.cssText = 'padding:8px 16px; background:#6b7280; color:#fff; border:none; border-radius:4px; cursor:pointer;';

        const saveBtn = document.createElement('button');
        saveBtn.type = 'button';
        saveBtn.innerText = 'Save Crop';
        saveBtn.style.cssText = 'padding:8px 16px; background:#10b981; color:#fff; border:none; border-radius:4px; cursor:pointer;';

        cropContainer.appendChild(img);
        actionWrapper.appendChild(cancelBtn);
        actionWrapper.appendChild(saveBtn);
        modalOverlay.appendChild(cropContainer);
        modalOverlay.appendChild(actionWrapper);
        document.body.appendChild(modalOverlay);

        const cropper = new Cropper(img, { aspectRatio: 1, viewMode: 1, autoCropArea: 1 });

        cancelBtn.addEventListener('click', () => {
            cropper.destroy();
            document.body.removeChild(modalOverlay);
        });

        saveBtn.addEventListener('click', () => {
            cropper.getCroppedCanvas({ width: 800, height: 800 }).toBlob((blob) => {
                imageArray[index].croppedBlob = blob;
                renderThumbnails();
                cropper.destroy();
                document.body.removeChild(modalOverlay);
            }, 'image/png');
        });
    }

    // --- 🔍 VALIDATION ENGINE LOGIC ---
    function validateFormInputs() {
        let isValid = true;
        clearErrors();

        const title = document.getElementById('title');
        const category = document.getElementById('category');
        const author = document.getElementById('author');
        const price = document.getElementById('price');
        const quantity = document.getElementById('quantity');
        const description = document.getElementById('description');

        if (!title || !title.value.trim()) { showError('titleError', 'Title is required'); isValid = false; }
        if (!category || !category.value.trim()) { showError('categoryError', 'Please select a valid category'); isValid = false; }
        if (!author || !author.value.trim()) { showError('authorError', 'Author name is required'); isValid = false; }
        if (!description || !description.value.trim()) { showError('descriptionError', 'Description is required'); isValid = false; }
        
        if (!price || !price.value.trim() || parseFloat(price.value) <= 0) { 
            showError('priceError', 'Price must be a positive number'); isValid = false; 
        }
        if (!quantity || !quantity.value.trim() || parseInt(quantity.value) < 0) { 
            showError('quantityError', 'Stock quantity cannot be negative'); isValid = false; 
        }

        // Only throw image errors if they actively tried to change them
        if (imageUpload.files.length > 0 && imageArray.length < 3) {
            showError('imageError', 'You must upload between 3 and 5 images if changing them.');
            isValid = false;
        }

        return isValid;
    }

    function showError(elementId, message) {
        const errorSpan = document.getElementById(elementId);
        if (errorSpan) {
            errorSpan.innerText = message;
            errorSpan.style.display = 'block';
        }
    }

    function clearIntervals() {} // Placeholder if needed

    function clearErrors() {
        document.querySelectorAll('.error-message').forEach(span => {
            span.innerText = '';
            span.style.display = 'none';
        });
    }

    // --- 🚀 INTERCEPT UPDATE HANDLER ---
    form.addEventListener('submit', async function(e) {
        e.preventDefault(); 

        const isFormValid = validateFormInputs();
        if (!isFormValid) {
            console.log("❌ Submit blocked: Client-side validation failed.");
            return; 
        }

        console.log("✅ Validation passed! Compiling FormData payloads...");
        const formData = new FormData(this);
        formData.delete('images'); // Discard uncropped baseline files

        // Only append images if new ones were picked
        if (imageArray.length > 0) {
            imageArray.forEach((item, index) => {
                if (item.croppedBlob) {
                    formData.append('images', item.croppedBlob, `cropped-${Date.now()}-${index}.png`);
                } else {
                    formData.append('images', imageUpload.files[index]);
                }
            });
        }

        try {
            const response = await fetch(this.action, {
                method: 'POST',
                body: formData
            });

            // Read the raw response as plain text first to safely inspect it
            const textData = await response.text();
            
            let data;
            try {
                data = JSON.parse(textData);
            } catch (jsonError) {
                // If parsing fails, the backend returned an HTML error page or an unexpected redirect string
                console.error("🚨 CRITICAL: The backend sent HTML formatting instead of JSON.");
                console.error("Raw Server Output follows:\n", textData);
                alert("The backend sent back an HTML payload instead of JSON. Press F12 and look at your browser console to read the server error!");
                return;
            }

            if (response.ok) {
                window.location.href = data.redirectUrl || '/admin/products'; 
            } else {
                alert("Backend Rejection: " + (data.error || 'Failed to update product.'));
            }
        } catch (error) {
            console.error('Network Upload Exception:', error);
            alert('A network error occurred while updating the server.');
        }
    });
});