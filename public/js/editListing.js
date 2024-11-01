// public/js/editListing.js

document.addEventListener("DOMContentLoaded", () => {
    const uploadButton = document.getElementById('editUploadBtn');
    const fileInput = document.getElementById('editPhotos');
    const photoThumbnails = document.querySelector(".photo-thumbnails");
    const maxPhotos = 5; // Maximum number of photos to preview

    if (uploadButton && fileInput) {
        uploadButton.addEventListener("click", () => {
            fileInput.click();
        });
    }

    if (fileInput) {
        fileInput.addEventListener("change", () => {
            const files = Array.from(fileInput.files);
            // Limit the number of files to maxPhotos
            const filesToUpload = files.slice(0, maxPhotos);
            photoThumbnails.innerHTML = ""; // Clear existing thumbnails

            filesToUpload.forEach((file) => {
                if (!file.type.startsWith("image/")) return; // Skip non-image files
                const reader = new FileReader();
                reader.onload = (e) => {
                    const img = document.createElement("img");
                    img.src = e.target.result;
                    img.alt = "Photo Preview";
                    img.classList.add("thumbnail");
                    photoThumbnails.appendChild(img);
                };
                reader.readAsDataURL(file);
            });
        });
    }

    // Drag and Drop Functionality (if applicable)
    const photoUploadSection = document.querySelector(".photo-upload-section");

    if (photoUploadSection) {
        photoUploadSection.addEventListener("dragover", (e) => {
            e.preventDefault();
            photoUploadSection.classList.add("dragover");
        });

        photoUploadSection.addEventListener("dragleave", (e) => {
            e.preventDefault();
            photoUploadSection.classList.remove("dragover");
        });

        photoUploadSection.addEventListener("drop", (e) => {
            e.preventDefault();
            photoUploadSection.classList.remove("dragover");
            const files = Array.from(e.dataTransfer.files);
            // Limit the number of files to maxPhotos
            const filesToUpload = files.slice(0, maxPhotos);
            photoThumbnails.innerHTML = ""; // Clear existing thumbnails

            filesToUpload.forEach((file) => {
                if (!file.type.startsWith("image/")) return; // Skip non-image files
                const reader = new FileReader();
                reader.onload = (e) => {
                    const img = document.createElement("img");
                    img.src = e.target.result;
                    img.alt = "Photo Preview";
                    img.classList.add("thumbnail");
                    photoThumbnails.appendChild(img);
                };
                reader.readAsDataURL(file);
            });
        });
    }
});
