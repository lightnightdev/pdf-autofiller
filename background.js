chrome.action.onClicked.addListener((tab) => {
  chrome.tabs.create({
    url: 'pdf-autofill.html'
  });
});