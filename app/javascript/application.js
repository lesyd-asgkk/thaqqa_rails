// Entry point for the build script in your package.json
import "@hotwired/turbo-rails"
import "./controllers"
import "bootstrap"

document.addEventListener("turbo:load", () => {
  document.querySelectorAll(".alert[data-auto-dismiss]").forEach((alert) => {
    setTimeout(() => {
      alert.style.transition = "opacity 0.5s ease";
      alert.style.opacity = "0";

      setTimeout(() => {
        alert.remove();
      }, 500);
    }, 4000);
  });
});