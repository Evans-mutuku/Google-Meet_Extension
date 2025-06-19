// Utility to get meeting ID from URL
function getMeetingId() {
  const match = window.location.pathname.match(/\/(\w{3}-\w{4}-\w{3})/);
  return match ? match[1] : null;
}

// Track attendees
let attendees = {};
let trackingEnabled = true;

// Listen for popup toggle
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'TOGGLE_TRACKING') {
    trackingEnabled = message.enabled;
    sendResponse({ status: 'ok' });
  }
});

// Get host email
function getHostEmail(callback) {
  chrome.runtime.sendMessage({ type: 'GET_HOST_EMAIL' }, (response) => {
    callback(response.email);
  });
}

// Observe participant list
function observeParticipants() {
  const participantSelector = '[data-participant-id]';
  const container = document.querySelector('div[role="list"]');
  if (!container) return;

  const observer = new MutationObserver(() => {
    if (!trackingEnabled) return;
    const nodes = container.querySelectorAll(participantSelector);
    nodes.forEach(node => {
      const name = node.getAttribute('aria-label');
      const email = node.getAttribute('data-participant-id');
      if (!attendees[email]) {
        attendees[email] = {
          fullName: name,
          email: email,
          timeJoined: new Date().toISOString(),
          timeLeft: null,
          totalTimeAttended: 0
        };
        sendAttendeeData(attendees[email]);
      }
    });
    // Check for participants who left
    Object.keys(attendees).forEach(email => {
      const stillPresent = Array.from(nodes).some(node => node.getAttribute('data-participant-id') === email);
      if (!stillPresent && !attendees[email].timeLeft) {
        attendees[email].timeLeft = new Date().toISOString();
        attendees[email].totalTimeAttended = (new Date(attendees[email].timeLeft) - new Date(attendees[email].timeJoined)) / 1000;
        sendAttendeeData(attendees[email]);
      }
    });
  });
  observer.observe(container, { childList: true, subtree: true });
}

function sendAttendeeData(attendee) {
  const meetingId = getMeetingId();
  chrome.runtime.sendMessage({
    type: 'SAVE_ATTENDEE_DATA',
    payload: { meetingId, attendee }
  });
}

// Start tracking if host
getHostEmail((hostEmail) => {
  // You may want to check if hostEmail matches the meeting creator
  observeParticipants();
}); 