// Background service worker for MeetAttendify
// 1. Initialize Firebase
// 2. Authenticate user via Chrome Identity API
// 3. Listen for messages from content script
// 4. Write attendance reports to Firestore

// TODO: Initialize Firebase
// TODO: Handle authentication
// TODO: Listen for messages from content script
// TODO: Write reports to Firestore 

import { firebaseConfig } from '../firebase/firebase.js';

const FIREBASE_PROJECT_ID = firebaseConfig.projectId;
const FIREBASE_API_KEY = firebaseConfig.apiKey;

let idToken = null;

async function authenticate() {
  return new Promise((resolve, reject) => {
    chrome.identity.getAuthToken({ interactive: true }, token => {
      if (chrome.runtime.lastError || !token) {
        reject(chrome.runtime.lastError);
      } else {
        idToken = token;
        resolve(token);
      }
    });
  });
}

async function writeReportToFirestore(report) {
  if (!idToken) await authenticate();
  const url = `https://firestore.googleapis.com/v1/projects/${FIREBASE_PROJECT_ID}/databases/(default)/documents/meetings/${report.meetingId}`;
  const body = {
    fields: {
      meetingId: { stringValue: report.meetingId },
      timestamp: { stringValue: report.timestamp }
    }
  };
  await fetch(url + `?key=${FIREBASE_API_KEY}`, {
    method: 'PATCH',
    headers: {
      'Authorization': `Bearer ${idToken}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(body)
  });
  for (const attendee of report.attendees) {
    const attendeeUrl = `${url}/attendees?key=${FIREBASE_API_KEY}`;
    await fetch(attendeeUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${idToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        fields: {
          name: { stringValue: attendee.name },
          email: { stringValue: attendee.email || '' },
          joinTime: { integerValue: attendee.joinTime || 0 },
          leaveTime: { integerValue: attendee.leaveTime || 0 },
          duration: { integerValue: attendee.duration || 0 }
        }
      })
    });
  }
}

chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (msg.type === 'MEETING_REPORT') {
    writeReportToFirestore(msg.report)
      .then(() => sendResponse({ status: 'ok' }))
      .catch(e => sendResponse({ status: 'error', error: e.message }));
    return true;
  }
}); 