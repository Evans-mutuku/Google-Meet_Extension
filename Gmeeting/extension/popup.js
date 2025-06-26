const toggle = document.getElementById('toggleTracking');

toggle.addEventListener('change', () => {
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    chrome.tabs.sendMessage(tabs[0].id, {
      type: 'TOGGLE_TRACKING',
      enabled: toggle.checked
    });
  });
}); 