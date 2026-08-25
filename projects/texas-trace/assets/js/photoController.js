(function () {
  "use strict";

  function create(options) {
    var adapter = options.adapter;
    var previewElement = options.previewElement;
    var countElement = options.countElement;
    var lightboxElement = options.lightboxElement;
    var lightboxImage = options.lightboxImage;
    var lightboxCaption = options.lightboxCaption;
    var lightboxPrevButton = options.lightboxPrevButton;
    var lightboxNextButton = options.lightboxNextButton;
    var activeGroup = null;
    var activeImages = [];
    var activeTitle = "";
    var activeIndex = 0;

    function getPhotoLabel(image) {
      return image.caption || activeTitle;
    }

    function renderLightboxPhoto() {
      if (!lightboxElement || !lightboxImage || !lightboxCaption) {
        return;
      }

      var image = activeImages[activeIndex];
      if (!activeGroup || !image) {
        return;
      }

      var paths = adapter.getPhotoPaths(activeGroup, image);
      var label = getPhotoLabel(image);
      var positionText = activeImages.length > 1 ? " (" + (activeIndex + 1) + "/" + activeImages.length + ")" : "";

      lightboxImage.removeAttribute("src");
      lightboxImage.alt = label;
      lightboxCaption.textContent = label + positionText;
      lightboxImage.src = paths.full;

      if (lightboxPrevButton) {
        lightboxPrevButton.hidden = activeImages.length <= 1;
      }
      if (lightboxNextButton) {
        lightboxNextButton.hidden = activeImages.length <= 1;
      }
    }

    function openLightbox(group, images, title, index) {
      if (!lightboxElement || !lightboxImage || !lightboxCaption) {
        return;
      }

      activeGroup = group;
      activeImages = images;
      activeTitle = title;
      activeIndex = index;
      lightboxElement.hidden = false;
      document.body.style.overflow = "hidden";
      renderLightboxPhoto();
    }

    function closeLightbox() {
      if (!lightboxElement || !lightboxImage) {
        return;
      }

      lightboxElement.hidden = true;
      lightboxImage.removeAttribute("src");
      document.body.style.overflow = "";
    }

    function showRelativePhoto(offset) {
      if (!activeImages.length) {
        return;
      }

      activeIndex = (activeIndex + offset + activeImages.length) % activeImages.length;
      renderLightboxPhoto();
    }

    function createEmptyState() {
      var empty = document.createElement("div");
      empty.className = "photo-empty";
      empty.textContent = "No photos yet";
      return empty;
    }

    function createPhotoButton(group, images, index, title, isFeatured) {
      var image = images[index];
      var paths = adapter.getPhotoPaths(group, image);
      var button = document.createElement("button");
      var img = document.createElement("img");
      var caption = document.createElement("span");

      button.type = "button";
      button.className = "photo-button" + (isFeatured ? " featured" : "");
      button.setAttribute("aria-label", "Open photo: " + (image.caption || title));

      img.src = paths.thumb;
      img.alt = image.caption || title;
      img.loading = "lazy";
      img.decoding = "async";

      img.addEventListener("error", function () {
        if (img.dataset.fallbackUsed !== "true") {
          img.dataset.fallbackUsed = "true";
          img.src = paths.full;
          return;
        }

        button.innerHTML = "";
        var error = document.createElement("div");
        error.className = "photo-error";
        error.textContent = "Image not found";
        button.appendChild(error);
      });

      caption.className = "photo-caption";
      caption.textContent = image.caption || title;

      button.appendChild(img);
      button.appendChild(caption);
      button.addEventListener("click", function () {
        openLightbox(group, images, title, index);
      });

      return button;
    }

    function render(step) {
      var presentation = adapter.getPresentation(step);
      var group = adapter.getMediaGroupForStep(step.stepId);
      var images = group && Array.isArray(group.images) ? group.images : [];
      var previewImages = images.slice(0, presentation.photoLimit);

      previewElement.innerHTML = "";
      previewElement.className = "photo-preview";
      if (countElement) {
        countElement.textContent = images.length + (images.length === 1 ? " photo" : " photos");
      }

      if (!group || previewImages.length === 0) {
        previewElement.classList.add("empty");
        previewElement.appendChild(createEmptyState());
        return;
      }

      if (previewImages.length === 1) {
        previewElement.classList.add("single");
        previewElement.appendChild(createPhotoButton(group, images, 0, step.title, true));
        return;
      }

      previewElement.appendChild(createPhotoButton(group, images, 0, step.title, true));

      var stack = document.createElement("div");
      stack.className = "photo-stack";
      previewImages.slice(1).forEach(function (image, index) {
        stack.appendChild(createPhotoButton(group, images, index + 1, step.title, false));
      });
      previewElement.appendChild(stack);
    }

    if (lightboxElement) {
      lightboxElement.addEventListener("click", function (event) {
        if (event.target.hasAttribute("data-lightbox-close")) {
          closeLightbox();
        }
        if (event.target.hasAttribute("data-lightbox-prev")) {
          showRelativePhoto(-1);
        }
        if (event.target.hasAttribute("data-lightbox-next")) {
          showRelativePhoto(1);
        }
      });
    }

    document.addEventListener("keydown", function (event) {
      if (!lightboxElement || lightboxElement.hidden) {
        return;
      }

      if (event.key === "Escape") {
        closeLightbox();
      }
      if (event.key === "ArrowLeft") {
        showRelativePhoto(-1);
      }
      if (event.key === "ArrowRight") {
        showRelativePhoto(1);
      }
    });

    return {
      render: render,
      closeLightbox: closeLightbox
    };
  }

  window.TexasTracePhotoController = {
    create: create
  };
})();
