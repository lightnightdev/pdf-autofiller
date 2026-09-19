// Note: Alpine loads after DOM
document.addEventListener("alpine:initialized", () => {
  // Wrap in a 0ms timeout to let all initialization code finish executing
  setTimeout(() => {
    window.viewState = Alpine.store("viewState");

    const menuState = Alpine.store("menuState");
    if (menuState) {
      menuState.open(1);
    } else {
      console.error(
        "Alpine store 'menuState' was not found! Check alpineSetup.js.",
      );
    }

    Promise.resolve().then(() => {
      loadCachedData();
    });
  }, 0);
});

document.addEventListener("DOMContentLoaded", () => {
  renderSavedCustomTextOptions();
  quickEnableTooltips();
});

function quickEnableTooltips() {
  var tooltipTriggerList = [].slice.call(
    document.querySelectorAll('[data-toggle="tooltip"]'),
  );
  tooltipTriggerList.forEach(function (el) {
    new bootstrap.Tooltip(el, {
      allowHtml: true, // <-- important for HTML rendering
      placement: el.getAttribute("data-placement") || "top",
    });
  });
}
