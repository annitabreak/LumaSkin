const screens = [...document.querySelectorAll("[data-screen]")];
const buttons = [...document.querySelectorAll("[data-go]")];

function showScreen(name) {
  screens.forEach((screen) => {
    screen.classList.toggle("screen-active", screen.dataset.screen === name);
  });
  window.history.replaceState(null, "", `#${name}`);
}

buttons.forEach((button) => {
  button.addEventListener("click", () => showScreen(button.dataset.go));
});

window.addEventListener("load", () => {
  const initial = window.location.hash.replace("#", "");
  if (initial && screens.some((screen) => screen.dataset.screen === initial)) {
    showScreen(initial);
  } else {
    setTimeout(() => showScreen("onboarding-1"), 850);
  }

  if ("serviceWorker" in navigator) {
    navigator.serviceWorker.register("/sw.js").catch(() => {});
  }
});
