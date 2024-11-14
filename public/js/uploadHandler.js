// public/js/uploadHandler.js

document.addEventListener("DOMContentLoaded", () => {
    const uploadButtons = document.querySelectorAll(".upload-button");
    const maxPhotos = 5; // Maximum number of photos allowed

    // Initialize an object to keep track of accumulated files per form
    const formsData = {};

    uploadButtons.forEach((button) => {
      const fileInput = button.nextElementSibling;
      const thumbnailsContainer = button
        .closest(".photo-upload-container")
        .querySelector(".photo-thumbnails");
      const form = button.closest("form");
      const formId = form.getAttribute("action"); // Unique identifier based on form action

      // Initialize accumulatedFiles for this form
      formsData[formId] = {
        accumulatedFiles: [],
        initialPhotosCount:
          parseInt(thumbnailsContainer.dataset.initialCount, 10) || 0,
      };

      if (button && fileInput) {
        button.addEventListener("click", () => {
          fileInput.click();
        });
      }

      if (fileInput && thumbnailsContainer) {
        fileInput.addEventListener("change", () => {
          const files = Array.from(fileInput.files);
          const { accumulatedFiles, initialPhotosCount } = formsData[formId];
          const remainingSlots =
            maxPhotos - initialPhotosCount - accumulatedFiles.length;

          if (remainingSlots <= 0) {
            showFeedback(
              `You've already uploaded the maximum of ${maxPhotos} photos.`,
              "error",
              form
            );
            fileInput.value = "";
            return;
          }

          let filesToUpload = files;

          if (files.length > remainingSlots) {
            showFeedback(
              `You can upload up to ${maxPhotos} photos. You've already uploaded ${
                initialPhotosCount + accumulatedFiles.length
              }.`,
              "error",
              form
            );
            // Limit the files to the remaining slots
            filesToUpload = files.slice(0, remainingSlots);
          }

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
              (f) => f.name === file.name && f.size === file.size
            );
            if (alreadyAdded) {
              showFeedback(
                `File ${file.name} is already added.`,
                "error",
                form
              );
              return;
            }

            accumulatedFiles.push(file);

            const reader = new FileReader();
            reader.onload = (e) => {
              // Create image element
              const img = document.createElement("img");
              img.src = e.target.result;
              img.alt = file.name;
              img.classList.add("thumbnail");
              img.setAttribute("loading", "lazy");

              // Append the new thumbnail
              thumbnailsContainer.appendChild(img);

              // Check if max photos reached to disable the upload button
              if (accumulatedFiles.length >= maxPhotos - initialPhotosCount) {
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
        const { accumulatedFiles, initialPhotosCount } = formsData[formId];
        const remainingSlots =
          maxPhotos - initialPhotosCount - accumulatedFiles.length;

        if (remainingSlots <= 0) {
          showFeedback(
            `You've already uploaded the maximum of ${maxPhotos} photos.`,
            "error",
            form
          );
          return;
        }

        let filesToUpload = files;

        if (files.length > remainingSlots) {
          showFeedback(
            `You can upload up to ${maxPhotos} photos. You've already uploaded ${
              initialPhotosCount + accumulatedFiles.length
            }.`,
            "error",
            form
          );
          // Limit the files to the remaining slots
          filesToUpload = files.slice(0, remainingSlots);
        }

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
            (f) => f.name === file.name && f.size === file.size
          );
          if (alreadyAdded) {
            showFeedback(`File ${file.name} is already added.`, "error", form);
            return;
          }

          accumulatedFiles.push(file);

          const reader = new FileReader();
          reader.onload = (e) => {
            // Create image element
            const img = document.createElement("img");
            img.src = e.target.result;
            img.alt = file.name;
            img.classList.add("thumbnail");
            img.setAttribute("loading", "lazy");

            // Append the new thumbnail
            thumbnailsContainer.appendChild(img);

            // Check if max photos reached to disable the upload button
            if (accumulatedFiles.length >= maxPhotos - initialPhotosCount) {
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
          formsData[formId].accumulatedFiles.forEach((file) => {
            dt.items.add(file);
          });

          // Set the file input's files to the accumulated files
          fileInput.files = dt.files;
        }
        // The form will now submit naturally with all accumulated files
      });
    });

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

      // Remove message after 3 seconds
      setTimeout(() => {
        uploadFeedback.innerHTML = "";
      }, 3000);
    }
});
