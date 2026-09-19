function handleKeydown(e) {
  if (Alpine.store("modal").isOpen) return; // Let modal handle keys

  switch (e.key) {
    case "Backspace":
    case "Delete":
      e.preventDefault();
      Alpine.store("locData").delCurrIdx();
      break;
    case "ArrowUp":
      e.preventDefault();
      Alpine.store("locData").moveSelected(0, -1);
      break;
    case "ArrowDown":
      e.preventDefault();
      Alpine.store("locData").moveSelected(0, 1);
      break;
    case "ArrowLeft":
      e.preventDefault();
      Alpine.store("locData").moveSelected(-1, 0);
      break;
    case "ArrowRight":
      e.preventDefault();
      Alpine.store("locData").moveSelected(1, 0);
      break;
    case "-":
      e.preventDefault();
      Alpine.store("locData").adjustSelectedSize(-1);
      break;
    case "=":
    case "+":
      e.preventDefault();
      Alpine.store("locData").adjustSelectedSize(1);
      break;
  }

  parsekey(e.key);
}

function parsekey(key) {
  const ld = Alpine.store("locData");
  switch (key) {
    case "[":
      ld.adjustSelectedSpacing(-1);
      break;
    case "]":
      ld.adjustSelectedSpacing(1);
      break;
    case "f":
      ld.cycleFont();
      break;
  }
}

window.addEventListener("keydown", handleKeydown);