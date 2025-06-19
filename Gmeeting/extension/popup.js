const toggle = document.getElementById('toggleTracking');

toggle.addEventListener('change', () => {
  // Send message to content script to enable/disable tracking
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    chrome.tabs.sendMessage(tabs[0].id, {
      type: 'TOGGLE_TRACKING',
      enabled: toggle.checked
    });
  });
}); 