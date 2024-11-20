// public/js/uploadHandler.js

document.addEventListener("DOMContentLoaded", () => {
    const uploadButtons = document.querySelectorAll(".upload-button");
    const maxPhotos = 5; // Maximum number of photos allowed
  
    // Initialize an object to keep track of accumulated files and current photo counts per form
    const formsData = {};
  
    uploadButtons.forEach((button) => {
        const fileInput = button.nextElementSibling;
        const thumbnailsContainer = button
            .closest(".photo-upload-container")
            .querySelector(".photo-thumbnails");
        const form = button.closest("form");
        const formId = form.getAttribute("action"); // Unique identifier based on form action
  
        // Initialize data for this form
        formsData[formId] = {
            accumulatedFiles: [], // Array of { id: uniqueId, file: File }
            currentPhotos:
                parseInt(thumbnailsContainer.dataset.initialCount, 10) || 0,
            fileIdCounter: 0, // Unique ID for each new photo
        };
  
        if (button && fileInput) {
            button.addEventListener("click", () => {
                fileInput.click();
            });
        }
  
        if (fileInput && thumbnailsContainer) {
            fileInput.addEventListener("change", () => {
                const files = Array.from(fileInput.files);
                const { accumulatedFiles, currentPhotos, fileIdCounter } = formsData[formId];
                const remainingSlots = maxPhotos - currentPhotos - accumulatedFiles.length;
  
                if (files.length > remainingSlots) {
                    showFeedback(
                        `You can only upload ${remainingSlots} more photo(s).`,
                        "error",
                        form
                    );
                }
  
                // Limit the files to remainingSlots
                const filesToUpload = files.slice(0, remainingSlots);
  
                if (filesToUpload.length === 0) {
                    showFeedback("No valid images selected.", "error", form);
                    fileInput.value = "";
                    return;
                }
  
                filesToUpload.forEach((file) => {
                    if (!file.type.startsWith("image/")) {
                        showFeedback("Only image files are allowed.", "error", form);
                        return;
                    }
  
                    // Prevent duplicate files
                    const alreadyAdded = accumulatedFiles.some(
                        (f) => f.file.name === file.name && f.file.size === file.size
                    );
                    if (alreadyAdded) {
                        showFeedback(
                            `File ${file.name} is already added.`,
                            "error",
                            form
                        );
                        return;
                    }
  
                    // Increment fileIdCounter and assign a unique ID
                    formsData[formId].fileIdCounter += 1;
                    const uniqueId = formsData[formId].fileIdCounter;
  
                    // Push the file with unique ID
                    accumulatedFiles.push({ id: uniqueId, file: file });
  
                    const reader = new FileReader();
                    reader.onload = (e) => {
                        // Create image element
                        const img = document.createElement("img");
                        img.src = e.target.result;
                        img.alt = file.name;
                        img.classList.add("thumbnail");
                        img.setAttribute("loading", "lazy");
  
                        // Create a wrapper for the thumbnail and a delete button
                        const photoWrapper = document.createElement("div");
                        photoWrapper.classList.add("photo-thumbnail-wrapper");
  
                        // Append the image to the wrapper
                        photoWrapper.appendChild(img);
  
                        // Create delete button
                        const deleteButton = document.createElement("button");
                        deleteButton.type = "button";
                        deleteButton.classList.add("remove-photo-btn");
                        deleteButton.setAttribute("aria-label", "Remove photo");
                        deleteButton.setAttribute("data-existing", "false"); // New photo
                        deleteButton.setAttribute("data-id", uniqueId); // Assign unique ID
                        deleteButton.innerHTML = "&times;";
  
                        // Append delete button to the wrapper
                        photoWrapper.appendChild(deleteButton);
  
                        // Append the wrapper to the thumbnails container
                        thumbnailsContainer.appendChild(photoWrapper);
  
                        // Attach event listener to the delete button
                        deleteButton.addEventListener("click", () => {
                            handleRemovePhoto(deleteButton, form);
                        });
  
                        // Check if max photos reached to disable the upload button
                        const newRemainingSlots = maxPhotos - formsData[formId].currentPhotos - formsData[formId].accumulatedFiles.length;
                        if (newRemainingSlots <= 0) {
                            button.disabled = true;
                            button.style.cursor = "not-allowed";
                            button.style.opacity = "0.6";
                            showFeedback(
                                "You've reached the maximum number of photos.",
                                "info",
                                form
                            );
                        }
                    };
                    reader.readAsDataURL(file);
                });
  
                // Reset the file input to allow selecting the same files again if needed
                fileInput.value = "";
            });
        }
  
        // Attach event listeners to existing delete buttons
        const existingDeleteButtons = thumbnailsContainer.querySelectorAll(".remove-photo-btn");
  
        existingDeleteButtons.forEach(button => {
            button.addEventListener("click", () => {
                handleRemovePhoto(button, form);
            });
  
            // Handle keyboard accessibility
            button.addEventListener("keydown", (e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault(); // Prevent default button behavior
                    button.click(); // Trigger the click event
                }
            });
        });
    });
  
    // Drag and Drop Functionality
    const photoUploadSections = document.querySelectorAll(
        ".photo-upload-section"
    );
  
    photoUploadSections.forEach((section) => {
        const uploadButton = section.querySelector(".upload-button");
        const fileInput = section.querySelector(".hidden-file-input");
        const thumbnailsContainer = section.querySelector(".photo-thumbnails");
        const form = section.closest("form");
        const formId = form.getAttribute("action"); // Unique identifier based on form action
  
        section.addEventListener("dragover", (e) => {
            e.preventDefault();
            section.classList.add("dragover");
        });
  
        section.addEventListener("dragleave", (e) => {
            e.preventDefault();
            section.classList.remove("dragover");
        });
  
        section.addEventListener("drop", (e) => {
            e.preventDefault();
            section.classList.remove("dragover");
            const files = Array.from(e.dataTransfer.files);
            const { accumulatedFiles, currentPhotos, fileIdCounter } = formsData[formId];
            const remainingSlots = maxPhotos - currentPhotos - accumulatedFiles.length;
  
            if (files.length > remainingSlots) {
                showFeedback(
                    `You can only upload ${remainingSlots} more photo(s).`,
                    "error",
                    form
                );
            }
  
            // Limit the files to remainingSlots
            const filesToUpload = files.slice(0, remainingSlots);
  
            if (filesToUpload.length === 0) {
                showFeedback("No valid images selected.", "error", form);
                return;
            }
  
            filesToUpload.forEach((file) => {
                if (!file.type.startsWith("image/")) {
                    showFeedback("Only image files are allowed.", "error", form);
                    return;
                }
  
                // Prevent duplicate files
                const alreadyAdded = accumulatedFiles.some(
                    (f) => f.file.name === file.name && f.file.size === file.size
                );
                if (alreadyAdded) {
                    showFeedback(`File ${file.name} is already added.`, "error", form);
                    return;
                }
  
                // Increment fileIdCounter and assign a unique ID
                formsData[formId].fileIdCounter += 1;
                const uniqueId = formsData[formId].fileIdCounter;
  
                // Push the file with unique ID
                accumulatedFiles.push({ id: uniqueId, file: file });
  
                const reader = new FileReader();
                reader.onload = (e) => {
                    // Create image element
                    const img = document.createElement("img");
                    img.src = e.target.result;
                    img.alt = file.name;
                    img.classList.add("thumbnail");
                    img.setAttribute("loading", "lazy");
  
                    // Create a wrapper for the thumbnail and a delete button
                    const photoWrapper = document.createElement("div");
                    photoWrapper.classList.add("photo-thumbnail-wrapper");
  
                    // Append the image to the wrapper
                    photoWrapper.appendChild(img);
  
                    // Create delete button
                    const deleteButton = document.createElement("button");
                    deleteButton.type = "button";
                    deleteButton.classList.add("remove-photo-btn");
                    deleteButton.setAttribute("aria-label", "Remove photo");
                    deleteButton.setAttribute("data-existing", "false"); // New photo
                    deleteButton.setAttribute("data-id", uniqueId); // Assign unique ID
                    deleteButton.innerHTML = "&times;";
  
                    // Append delete button to the wrapper
                    photoWrapper.appendChild(deleteButton);
  
                    // Append the wrapper to the thumbnails container
                    thumbnailsContainer.appendChild(photoWrapper);
  
                    // Attach event listener to the delete button
                    deleteButton.addEventListener("click", () => {
                        handleRemovePhoto(deleteButton, form);
                    });
  
                    // Check if max photos reached to disable the upload button
                    const newRemainingSlots = maxPhotos - formsData[formId].currentPhotos - formsData[formId].accumulatedFiles.length;
                    if (newRemainingSlots <= 0) {
                        uploadButton.disabled = true;
                        uploadButton.style.cursor = "not-allowed";
                        uploadButton.style.opacity = "0.6";
                        showFeedback(
                            "You've reached the maximum number of photos.",
                            "info",
                            form
                        );
                    }
                };
                reader.readAsDataURL(file);
            });
  
            // Reset the file input to allow selecting the same files again if needed
            fileInput.value = "";
        });
    });
  
    // Handle Form Submission for Both Create and Edit Forms
    const forms = document.querySelectorAll(
        'form[action^="/listing/create"], form[action^="/listing/edit/"]'
    );
  
    forms.forEach((form) => {
        const formId = form.getAttribute("action");
        form.addEventListener("submit", (e) => {
            const fileInput = form.querySelector('input[name="photos"]');
            if (fileInput && formsData[formId].accumulatedFiles.length > 0) {
                // Clear the file input
                fileInput.value = "";
  
                // Create a new DataTransfer object
                const dt = new DataTransfer();
  
                // Add accumulated files to the DataTransfer object
                formsData[formId].accumulatedFiles.forEach((fileObj) => {
                    dt.items.add(fileObj.file);
                });
  
                // Set the file input's files to the accumulated files
                fileInput.files = dt.files;
            }
            // The form will now submit naturally with all accumulated files
        });
    });
  
    /* === Flash Message Dismissal Functionality === */
    // Select all flash message close buttons
    const flashCloseButtons = document.querySelectorAll('.flash-close-btn');
  
    flashCloseButtons.forEach(button => {
        // Handle manual dismissal via click
        button.addEventListener('click', () => {
            const flashMessage = button.parentElement;
            flashMessage.style.transition = "opacity 0.5s ease-out";
            flashMessage.style.opacity = "0";
            setTimeout(() => {
                flashMessage.remove();
            }, 500); // Duration matches the CSS transition
        });
  
        // Handle manual dismissal via keyboard (Enter or Space)
        button.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault(); // Prevent default button behavior
                button.click(); // Trigger the click event
            }
        });
    });
  
    // Auto-dismiss flash messages after a set duration (e.g., 5 seconds)
    const flashMessages = document.querySelectorAll('.flash-message');
  
    flashMessages.forEach(message => {
        setTimeout(() => {
            message.style.transition = "opacity 0.5s ease-out";
            message.style.opacity = "0";
            setTimeout(() => {
                message.remove();
            }, 500); // Duration matches the CSS transition
        }, 5000); // 5 seconds
    });
  
    /* === Photo Deletion Functionality === */
    // Function to handle photo removal
    function handleRemovePhoto(button, form) {
        const photoWrapper = button.parentElement;
        const photoUrl = button.getAttribute('data-photo');
        const isExisting = button.getAttribute('data-existing') === 'true';
        const formId = form.getAttribute("action");
        const formData = formsData[formId];
  
        // Remove the photo thumbnail from the DOM
        photoWrapper.remove();
  
        if (isExisting) {
            // Existing photo: decrement currentPhotos and add to removedPhotos[]
            if (formData.currentPhotos > 0) {
                formData.currentPhotos--;
            }
  
            // Add to removedPhotos[] for backend processing
            const removedPhotosContainer = form.querySelector("#removedPhotosContainer");
            const hiddenInput = document.createElement("input");
            hiddenInput.type = "hidden";
            hiddenInput.name = "removedPhotos[]";
            hiddenInput.value = photoUrl;
            removedPhotosContainer.appendChild(hiddenInput);
        } else {
            // Newly uploaded photo: decrement currentPhotos and remove from accumulatedFiles
            if (formData.currentPhotos > 0) {
                formData.currentPhotos--;
            }
  
            // Get the unique ID
            const uniqueId = button.getAttribute('data-id');
            if (uniqueId) {
                // Find the index of the file with this ID
                const fileIndex = formData.accumulatedFiles.findIndex(fileObj => fileObj.id.toString() === uniqueId);
                if (fileIndex !== -1) {
                    // Remove the file from accumulatedFiles
                    formData.accumulatedFiles.splice(fileIndex, 1);
                }
            }
        }
  
        // Re-enable the upload button if there's room
        const uploadButton = form.querySelector(".upload-button");
        const remainingSlots = maxPhotos - formData.currentPhotos - formData.accumulatedFiles.length;
  
        if (uploadButton.disabled && remainingSlots > 0) {
            uploadButton.disabled = false;
            uploadButton.style.cursor = "pointer";
            uploadButton.style.opacity = "1";
        }
    }
  
    // Feedback Function
    function showFeedback(message, type, form) {
        // Assuming there's a div with class 'upload-feedback' within each form to show messages
        let uploadFeedback = form.querySelector(".upload-feedback");
  
        if (!uploadFeedback) {
            // If not present, create it and append to the form
            uploadFeedback = document.createElement("div");
            uploadFeedback.classList.add("upload-feedback");
            uploadFeedback.style.position = "relative"; // Positioned within the form
            uploadFeedback.style.marginTop = "10px";
            form.appendChild(uploadFeedback);
        }
  
        // Clear previous messages
        uploadFeedback.innerHTML = "";
  
        // Create message div
        const msgDiv = document.createElement("div");
        msgDiv.classList.add("alert", type); // e.g., 'alert error', 'alert success', 'alert info'
        msgDiv.textContent = message;
  
        // Style the alert based on type
        switch (type) {
            case "error":
                msgDiv.style.backgroundColor = "#f8d7da";
                msgDiv.style.color = "#721c24";
                msgDiv.style.padding = "10px";
                msgDiv.style.marginBottom = "10px";
                msgDiv.style.borderRadius = "5px";
                break;
            case "success":
                msgDiv.style.backgroundColor = "#d4edda";
                msgDiv.style.color = "#155724";
                msgDiv.style.padding = "10px";
                msgDiv.style.marginBottom = "10px";
                msgDiv.style.borderRadius = "5px";
                break;
            case "info":
                msgDiv.style.backgroundColor = "#cce5ff";
                msgDiv.style.color = "#004085";
                msgDiv.style.padding = "10px";
                msgDiv.style.marginBottom = "10px";
                msgDiv.style.borderRadius = "5px";
                break;
            default:
                msgDiv.style.backgroundColor = "#e2e3e5";
                msgDiv.style.color = "#383d41";
                msgDiv.style.padding = "10px";
                msgDiv.style.marginBottom = "10px";
                msgDiv.style.borderRadius = "5px";
        }
  
        // Append to feedback container
        uploadFeedback.appendChild(msgDiv);
  
        // Remove message after 5 seconds
        setTimeout(() => {
            uploadFeedback.innerHTML = "";
        }, 5000);
    }
  });
  