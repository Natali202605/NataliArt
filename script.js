const mainScreen = document.getElementById("mainScreen");
const worksScreen = document.getElementById("worksScreen");
const showWorksBtn = document.getElementById("showWorksBtn");
const backBtn = document.getElementById("backBtn");

showWorksBtn.addEventListener("click", () => {
  mainScreen.classList.remove("active");
  worksScreen.classList.add("active");
});

backBtn.addEventListener("click", () => {
  worksScreen.classList.remove("active");
  mainScreen.classList.add("active");
});

const snowLayer = document.getElementById("snowLayer");
const flakes = 26;

for (let i = 0; i < flakes; i += 1) {
  const flake = document.createElement("span");
  const size = Math.random() * 5 + 3;
  const left = Math.random() * 100;
  const delay = Math.random() * 8;
  const duration = Math.random() * 12 + 8;
  const opacity = Math.random() * 0.5 + 0.25;

  flake.style.left = left + "%";
  flake.style.width = size + "px";
  flake.style.height = size + "px";
  flake.style.opacity = opacity;
  flake.style.animationDuration = duration + "s";
  flake.style.animationDelay = -delay + "s";
  snowLayer.appendChild(flake);
}

const categoryButtons = document.querySelectorAll(".category-btn");
const galleryItems = document.querySelectorAll(".gallery-item");

const showCategory = (category) => {
  galleryItems.forEach((item) => {
    const isVisible = item.dataset.category === category;
    item.classList.toggle("hidden", !isVisible);
  });
};

categoryButtons.forEach((button) => {
  button.addEventListener("click", () => {
    categoryButtons.forEach((btn) => btn.classList.remove("active"));
    button.classList.add("active");
    showCategory(button.dataset.category);
  });
});

showCategory("portraits");

const openModalButtons = document.querySelectorAll("[data-modal-open]");
const closeModalButtons = document.querySelectorAll("[data-modal-close]");
const modals = document.querySelectorAll(".modal");

const closeAllModals = () => {
  modals.forEach((modal) => modal.classList.remove("open"));
  document.body.style.overflow = "";
};

openModalButtons.forEach((button) => {
  button.addEventListener("click", () => {
    const modalId = button.dataset.modalOpen;
    const modal = document.getElementById(modalId);
    if (!modal) return;
    modal.classList.add("open");
    document.body.style.overflow = "hidden";
  });
});

closeModalButtons.forEach((button) => {
  button.addEventListener("click", closeAllModals);
});

modals.forEach((modal) => {
  modal.addEventListener("click", (event) => {
    if (event.target === modal) {
      closeAllModals();
    }
  });
});

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape") {
    closeAllModals();
  }
});

const contactForm = document.querySelector(".contact-form");

contactForm.addEventListener("submit", (event) => {
  event.preventDefault();
  alert("Спасибо! Ваша заявка отправлена.");
  contactForm.reset();
  closeAllModals();
});
