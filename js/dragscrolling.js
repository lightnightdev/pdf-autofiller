let isRightDragging = false;
let startX, startY, scrollLeft, scrollTop;

const scrollElement = document.getElementById('pdf-main');

scrollElement.addEventListener('mousedown', (e) => {
  if (e.button === 2) {
    e.preventDefault();
    isRightDragging = true;
    startX = e.pageX;
    startY = e.pageY;
    scrollLeft = scrollElement.scrollLeft;
    scrollTop = scrollElement.scrollTop;
    scrollElement.style.cursor = 'grabbing';
  }
});

document.addEventListener('mousemove', (e) => {
  if (!isRightDragging) return;
  e.preventDefault();
  const walkX = (startX - e.pageX) * 1.5;
  const walkY = (startY - e.pageY) * 1.5;
  scrollElement.scrollLeft = scrollLeft + walkX;
  scrollElement.scrollTop = scrollTop + walkY;
});

document.addEventListener('mouseup', () => {
  isRightDragging = false;
  scrollElement.style.cursor = 'default';
});

scrollElement.addEventListener('contextmenu', (e) => e.preventDefault());