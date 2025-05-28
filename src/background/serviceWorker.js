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
  // Validate message type
  if (!msg || typeof msg !== 'object') {
    console.error('Invalid message received:', msg);
    sendResponse({ status: 'error', error: 'Invalid message format' });
    return false;
  }

  if (msg.type === 'MEETING_REPORT') {
    // Validate report data
    if (!msg.report || !msg.report.meetingId) {
      console.error('Invalid meeting report:', msg.report);
      sendResponse({ status: 'error', error: 'Invalid meeting report format' });
      return false;
    }

    console.log('Processing meeting report:', msg.report.meetingId);
    
    // Handle the async operation properly
    (async () => {
      try {
        await writeReportToFirestore(msg.report);
        console.log('Successfully wrote meeting report:', msg.report.meetingId);
        sendResponse({ status: 'ok' });
      } catch (error) {
        console.error('Failed to write meeting report:', error);
        sendResponse({ 
          status: 'error', 
          error: error.message || 'Failed to write meeting report'
        });
      }
    })();

    // Return true to indicate we will send response asynchronously
    return true;
  }

  // Handle unknown message types
  console.warn('Unknown message type received:', msg.type);
  sendResponse({ status: 'error', error: 'Unknown message type' });
  return false;
}); 