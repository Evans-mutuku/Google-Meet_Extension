// Content script for MeetAttendify
// 1. Auto-join logic
// 2. Open participants pane
// 3. Track attendance with MutationObserver
// 4. Send data to background service worker

// TODO: Implement auto-join logic
// TODO: Open participants pane
// TODO: Track join/leave events
// TODO: Send attendance data to background 

function waitForSelector(selector, timeout = 10000) {
  return new Promise((resolve, reject) => {
    const el = document.querySelector(selector);
    if (el) return resolve(el);
    const observer = new MutationObserver(() => {
      const el = document.querySelector(selector);
      if (el) {
        observer.disconnect();
        resolve(el);
      }
    });
    observer.observe(document.body, { childList: true, subtree: true });
    setTimeout(() => {
      observer.disconnect();
      reject(new Error('Timeout waiting for selector: ' + selector));
    }, timeout);
  });
}

async function autoJoinMeet() {
  try {
    const joinBtn = await waitForSelector('button[aria-label*="Join"], button[jsname="Qx7uuf"]');
    joinBtn.click();
  } catch (e) {}
}

async function openParticipantsPane() {
  try {
    const peopleBtn = await waitForSelector('button[aria-label*="Show everyone"], button[aria-label*="Participants"]');
    peopleBtn.click();
  } catch (e) {}
}

function getAttendees() {
  const nodes = document.querySelectorAll('[role="listitem"] [data-self-name], [role="listitem"] span[aria-label]');
  return Array.from(nodes).map(node => {
    const name = node.getAttribute('data-self-name') || node.getAttribute('aria-label') || node.textContent.trim();
    return {
      name,
      email: null,
      joinTime: Date.now(),
      leaveTime: null,
      duration: null
    };
  });
}

function trackAttendance() {
  const attendees = {};
  const observer = new MutationObserver(() => {
    const current = getAttendees();
    const now = Date.now();
    current.forEach(person => {
      if (!attendees[person.name]) {
        attendees[person.name] = { ...person, joinTime: now };
      }
    });
    Object.keys(attendees).forEach(name => {
      if (!current.find(p => p.name === name) && !attendees[name].leaveTime) {
        attendees[name].leaveTime = now;
        attendees[name].duration = attendees[name].leaveTime - attendees[name].joinTime;
      }
    });
  });
  observer.observe(document.body, { childList: true, subtree: true });

  window.addEventListener('beforeunload', () => {
    sendAttendance(attendees);
  });

  document.body.addEventListener('click', e => {
    if (e.target && e.target.getAttribute('aria-label')?.toLowerCase().includes('leave call')) {
      sendAttendance(attendees);
    }
  });
}

function sendAttendance(attendees) {
  const meetingId = window.location.pathname.split('/').pop();
  const report = {
    meetingId,
    timestamp: new Date().toISOString(),
    attendees: Object.values(attendees)
  };
  chrome.runtime.sendMessage({ type: 'MEETING_REPORT', report });
}

(async function main() {
  await autoJoinMeet();
  await openParticipantsPane();
  trackAttendance();
})(); 