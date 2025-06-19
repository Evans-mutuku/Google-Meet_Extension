// Utility to get meeting ID from URL
function getMeetingId() {
  const match = window.location.pathname.match(/\/(\w{3}-\w{4}-\w{3})/);
  return match ? match[1] : null;
}

let trackingEnabled = true;
let hostAttendee = null;
let hostJoinTime = null;
let hostEmailGlobal = null;
let attendanceInterval = null;
let currentMeetingId = null;

// Listen for popup toggle
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'TOGGLE_TRACKING') {
    trackingEnabled = message.enabled;
    if (trackingEnabled) {
      startHostAttendance();
    } else {
      stopHostAttendance();
    }
    sendResponse({ status: 'ok' });
  }
});

function getHostEmail(callback) {
  chrome.runtime.sendMessage({ type: 'GET_HOST_EMAIL' }, (response) => {
    callback(response.email);
  });
}

function getHostDisplayName(hostEmail) {
  // Try to find a participant node with the host's email
  const participantSelector = '[data-participant-id]';
  const nodes = document.querySelectorAll(participantSelector);
  for (const node of nodes) {
    if (node.getAttribute('data-participant-id') === hostEmail) {
      return node.getAttribute('aria-label') || hostEmail;
    }
  }
  // Fallback: try to get the name from the Meet header
  const headerName = document.querySelector('div[role="banner"] span');
  if (headerName) return headerName.textContent;
  return hostEmail;
}

function sendAttendeeData(attendee) {
  const meetingId = getMeetingId();
  chrome.runtime.sendMessage({
    type: 'SAVE_ATTENDEE_DATA',
    payload: { meetingId, attendee }
  });
}

function startHostAttendance() {
  getHostEmail((hostEmail) => {
    hostEmailGlobal = hostEmail;
    let displayName = getHostDisplayName(hostEmail);
    hostJoinTime = new Date();
    currentMeetingId = getMeetingId();
    hostAttendee = {
      fullName: displayName,
      email: hostEmail,
      timeJoined: hostJoinTime.toISOString(),
      timeLeft: null,
      totalTimeAttended: 0
    };
    sendAttendeeData(hostAttendee);
    console.log(`[Attendance] Joined meeting: ${currentMeetingId}`);
    // Optionally, re-assert presence every 30 seconds
    if (attendanceInterval) clearInterval(attendanceInterval);
    attendanceInterval = setInterval(() => {
      sendAttendeeData(hostAttendee);
    }, 30000);
  });
}

function stopHostAttendance() {
  if (hostAttendee && hostJoinTime) {
    hostAttendee.timeLeft = new Date().toISOString();
    hostAttendee.totalTimeAttended = (new Date(hostAttendee.timeLeft) - hostJoinTime) / 1000;
    sendAttendeeData(hostAttendee);
    console.log(`[Attendance] Left meeting: ${currentMeetingId}`);
  }
  if (attendanceInterval) clearInterval(attendanceInterval);
  hostAttendee = null;
  hostJoinTime = null;
  currentMeetingId = null;
}

// On script load, always start attendance if tracking is enabled
if (trackingEnabled) {
  startHostAttendance();
}

// Detect meeting switch (URL change)
let lastMeetingId = getMeetingId();
setInterval(() => {
  const newMeetingId = getMeetingId();
  if (trackingEnabled && newMeetingId && newMeetingId !== lastMeetingId) {
    // User switched meetings
    stopHostAttendance();
    startHostAttendance();
    lastMeetingId = newMeetingId;
  }
}, 2000);

// On leave, update host's timeLeft and totalTimeAttended
window.addEventListener('beforeunload', () => {
  stopHostAttendance();
}); 