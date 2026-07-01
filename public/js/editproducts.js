console.log("==== EDIT PRODUCTS SCRIPT IS ALIVE! ====");
document.addEventListener('DOMContentLoaded', () => {
    const form = document.querySelector('form');
    const dropArea = document.getElementById('dropArea');
    const imageUpload = document.getElementById('imageUpload');
    const previewContainer = document.getElementById('previewContainer');
    
    // Create a hidden input dynamically to handle individual slot replacements
    const replaceImageUpload = document.createElement('input');
    replaceImageUpload.type = 'file';
    replaceImageUpload.accept = 'image/*';
    replaceImageUpload.style.display = 'none';
    document.body.appendChild(replaceImageUpload);

    let replacementIndex = null; // Tracks which index is being swapped
    let imageArray = []; 

    if (!dropArea || !imageUpload || !form || !previewContainer) {
        console.error("Critical DOM elements missing. Check your HTML IDs!");
        return;
    }

    // --- 💾 INITIALIZE EXISTING IMAGES ---
    const existingData = JSON.parse(previewContainer.getAttribute('data-existing') || '[]');
    imageArray = existingData.map(img => ({
        type: 'existing',
        name: img,
        src: `/uploads/${img}`
    }));
    renderThumbnails();

    // --- 📸 IMAGE SELECTION & INTERACTION ---
    dropArea.addEventListener('click', () => imageUpload.click());

    // Bulk append from the primary drop zone
    imageUpload.addEventListener('change', function(e) {
        const files = e.target.files;
        if (!files.length) return;

        if (imageArray.length + files.length > 5) {
                Swal.fire({
                icon: "info",
                title: "Oops...",
                text: 'Maximum limit reached! A product cannot have more than 5 images.',

                });
            this.value = '';
            return;
        }

        Array.from(files).forEach((file) => {
            if (!file.type.startsWith('image/')) return;
            const reader = new FileReader();
            reader.onload = (event) => {
                imageArray.push({
                    type: 'new',
                    originalSrc: event.target.result,
                    croppedBlob: null,
                    filename: file.name,
                    fileObject: file
                });
                renderThumbnails();
            };
            reader.readAsDataURL(file);
        });
        this.value = ''; // Reset slot
    });

    // Single replacement handler
    replaceImageUpload.addEventListener('change', function(e) {
        const file = e.target.files[0];
        if (!file || !file.type.startsWith('image/')) return;

        const reader = new FileReader();
        reader.onload = (event) => {
            // Hot-swap the specific index item with a new uncropped instance
            imageArray[replacementIndex] = {
                type: 'new',
                originalSrc: event.target.result,
                croppedBlob: null,
                filename: file.name,
                fileObject: file
            };
            renderThumbnails();
        };
        reader.readAsDataURL(file);
        this.value = ''; // Reset slot
    });

    function renderThumbnails() {
        previewContainer.innerHTML = '';
        imageArray.forEach((item, index) => {
            const card = document.createElement('div');
            card.style.cssText = 'position:relative; display:inline-block; margin:15px; width:150px; text-align:center; border:1px solid #ddd; padding:5px; border-radius:6px; background:#fff;';

            const img = document.createElement('img');
            if (item.type === 'existing') {
                img.src = item.src;
            } else {
                img.src = item.croppedBlob ? URL.createObjectURL(item.croppedBlob) : item.originalSrc;
            }
            img.style.cssText = 'width:100%; height:150px; object-fit:cover; border-radius:4px;';
            card.appendChild(img);

            // Action Button Wrappers
            const btnContainer = document.createElement('div');
            btnContainer.style.cssText = 'margin-top:8px; display:flex; flex-direction:column; gap:5px;';

            if (item.type === 'existing') {
                const replaceBtn = document.createElement('button');
                replaceBtn.type = 'button';
                replaceBtn.innerText = '🔄 Replace';
                replaceBtn.style.cssText = 'width:100%; padding:6px; background:#f59e0b; color:#fff; border:none; border-radius:4px; cursor:pointer; font-size:12px;';
                replaceBtn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    replacementIndex = index;
                    replaceImageUpload.click();
                });
                btnContainer.appendChild(replaceBtn);
            } else {
                const cropBtn = document.createElement('button');
                cropBtn.type = 'button';
                cropBtn.innerText = item.croppedBlob ? '📊 Re-Crop' : '✂️ Crop Image';
                cropBtn.style.cssText = 'width:100%; padding:6px; background:#4f46e5; color:#fff; border:none; border-radius:4px; cursor:pointer; font-size:12px;';
                cropBtn.addEventListener('click', (e) => { e.stopPropagation(); openCropModal(index); });
                btnContainer.appendChild(cropBtn);
            }

            const deleteBtn = document.createElement('button');
            deleteBtn.type = 'button';
            deleteBtn.innerText = '🗑️ Remove';
            deleteBtn.style.cssText = 'width:100%; padding:6px; background:#ef4444; color:#fff; border:none; border-radius:4px; cursor:pointer; font-size:12px;';
            deleteBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                imageArray.splice(index, 1);
                renderThumbnails();
            });
            btnContainer.appendChild(deleteBtn);

            card.appendChild(btnContainer);
            previewContainer.appendChild(card);
        });
    }

    function openCropModal(index) {
        const item = imageArray[index];
        if (item.type !== 'new') return;

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

        // Total count validation check
        if (imageArray.length < 3 || imageArray.length > 5) {
            showError('imageError', 'The product must have between 3 and 5 total images.');
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

    function clearErrors() {
        document.querySelectorAll('.error-message').forEach(span => {
            span.innerText = '';
            span.style.display = 'none';
        });
    }

    // --- 🚀 INTERCEPT UPDATE HANDLER ---
    form.addEventListener('submit', async function(e) {
        e.preventDefault(); 

        if (!validateFormInputs()) {
            console.log("❌ Submit blocked: Client-side validation failed.");
            return; 
        }

        console.log("✅ Validation passed! Compiling mapped payload data...");
        const formData = new FormData(this);
        formData.delete('images'); // Discard baseline input payload elements

        // Map order sequence arrays so the backend knows where old files remain or new files inject
        let fileCounter = 0;
        imageArray.forEach((item) => {
            if (item.type === 'existing') {
                formData.append('imageOrder', item.name);
            } else if (item.type === 'new') {
                formData.append('imageOrder', `NEW_FILE_${fileCounter}`);
                fileCounter++;
                if (item.croppedBlob) {
                    formData.append('images', item.croppedBlob, `cropped-${Date.now()}-${fileCounter}.png`);
                } else {
                    formData.append('images', item.fileObject);
                }
            }
        });

        try {
            const response = await fetch(this.action, {
                method: 'POST',
                body: formData
            });

            const textData = await response.text();
            let data;
            try {
                data = JSON.parse(textData);
            } catch (jsonError) {
                console.error("🚨 CRITICAL: Unexpected backend output parsing error.", textData);
                alert("The server returned a bad payload response. Review your dev tools console.");
                return;
            }

            if (response.ok) {
                window.location.href = data.redirectUrl || '/admin/products'; 
            } else {
                Swal.fire({
                icon: "info",
                title: "Oops...",
                text: "Product name already exists!",

                });
            }
        } catch (error) {
            console.error('Network Upload Exception:', error);
                Swal.fire({
            title: "The Internet?",
            text: "Network error is occured?",
            icon: "question"
            });
        }
    });
});