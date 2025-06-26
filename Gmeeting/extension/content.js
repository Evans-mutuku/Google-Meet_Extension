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
  
  // Safe sendMessage wrapper with retry
  function safeSendMessage(message, callback) {
  
    try {
      chrome.runtime.sendMessage(message, callback);
    } catch (e) {
      if (e.message?.includes("Extension context invalidated")) {
        console.warn("Extension context invalidated, retrying...");
        setTimeout(() => {
          try {
            chrome.runtime.sendMessage(message, callback);
          } catch (err2) {
            console.error("Retry failed:", err2);
          }
        }, 2000);
      } else {
        console.error("SendMessage failed:", e);
      }
    }
  }
  
  // Ping background every 60s to keep service worker alive
  setInterval(() => {
    try {
      chrome.runtime.sendMessage({ type: 'PING' }, () => {});
    } catch (err) {
      console.warn("Background worker may have shut down:", err);
    }
  }, 60000);
  
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
    safeSendMessage({ type: 'GET_HOST_EMAIL' }, (response) => {
      callback(response && response.email ? response.email : 'unknown@unknown');
    });
  }
  
  function getHostDisplayName(hostEmail ) {
    if (!hostEmail || hostEmail === 'unknown@unknown') return hostEmail;
    const participantSelector = '[data-participant-id]';
    const nodes = document.querySelectorAll(participantSelector);
    for (const node of nodes) {
      const participantId = node.getAttribute('data-participant-id');
      if (participantId && participantId === hostEmail) {
        return node.getAttribute('aria-label') || hostEmail ;
      }
    }
    const headerName = document.querySelector('div[role="banner"] span');
    if (headerName) return headerName.textContent;
    return hostEmail ;
  }
  
  function sendAttendeeData(attendee) {
    const meetingId = getMeetingId();
    safeSendMessage({
      type: 'SAVE_ATTENDEE_DATA',
      payload: { meetingId, attendee }
    });
  }
  
  function startHostAttendance() {
    getHostEmail((hostEmail) => {
      hostEmailGlobal = hostEmail;
      let resolvedDisplayName = getHostDisplayName(hostEmail);
      hostJoinTime = new Date();
      currentMeetingId = getMeetingId();
      hostAttendee = {
        fullName: resolvedDisplayName,
        email: hostEmail,
        timeJoined: hostJoinTime.toISOString(),
        timeLeft: null,
        totalTimeAttended: 0
      };
      sendAttendeeData(hostAttendee);
      console.log(`[Attendance] Joined meeting: ${currentMeetingId}`);
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
  
  if (trackingEnabled) {
    startHostAttendance();
  }
  
  let lastMeetingId = getMeetingId();
  setInterval(() => {
    const newMeetingId = getMeetingId();
    if (trackingEnabled && newMeetingId && newMeetingId !== lastMeetingId) {
      stopHostAttendance();
      startHostAttendance();
      lastMeetingId = newMeetingId;
    }
  }, 2000);
  
  window.addEventListener('beforeunload', () => {
    stopHostAttendance();
  });
  
  
  // Helper to check if user is in a meeting
  function isInMeeting() {
    return Boolean(getMeetingId());
  }
  
  // Observe DOM changes to detect meeting exit
  const observer = new MutationObserver(() => {
    const inMeeting = isInMeeting();
    if (!inMeeting && hostAttendee) {
      stopHostAttendance();
    }
  });
  
  observer.observe(document.body, { childList: true, subtree: true });
  
  // Listen for URL changes (popstate)
  window.addEventListener('popstate', () => {
    const inMeeting = isInMeeting();
    if (!inMeeting && hostAttendee) {
      stopHostAttendance();
    }
  });
  