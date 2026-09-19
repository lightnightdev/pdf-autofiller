function showProgressToast(current, total, message = "Generating PDFs") {
  let container = document.getElementById('toast-container');
  let toast = document.getElementById('progress-toast');
  
  // Create toast if it doesn't exist
  if (!toast) {
    toast = document.createElement('div');
    toast.id = 'progress-toast';
    toast.className = 'progress-toast';
    toast.style.position = 'relative'; // For absolute positioning of button
    toast.innerHTML = `
      <button 
        onclick="document.getElementById('progress-toast').remove()" 
        style="
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          background: transparent;
          border: none;
          cursor: pointer;
          z-index: 10;
        "
      ></button>
      <div style="position: relative; z-index: 1; pointer-events: none;">
        <div>${message}</div>
        <div class="toast-progress">
          <div class="toast-progress-bar" id="progress-bar"></div>
        </div>
      </div>
    `;
    
    container.appendChild(toast);
  }
  
  // Update progress
  const percent = Math.round((current / total) * 100);
  const bar = document.getElementById('progress-bar');
  bar.style.width = `${percent}%`;
  bar.textContent = `${current}/${total}`;
  
  // Remove when complete
  if (current >= total) {
    setTimeout(() => {
      const toastToRemove = document.getElementById('progress-toast');
      if (toastToRemove) {
        toastToRemove.remove();
      }
    }, 2000);
  }
}