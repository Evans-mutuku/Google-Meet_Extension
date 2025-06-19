import { initializeApp } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-app.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-firestore.js";
import { getAuth} from "https://www.gstatic.com/firebasejs/9.23.0/firebase-auth.js";


// Firebase config
const firebaseConfig = {
  apiKey: "AIzaSyBqRGfNOCRA06URvZ8VD8Ny8paPTpuqCfw",
  authDomain: "mentorship-74ad7.firebaseapp.com",
  projectId: "mentorship-74ad7",
  storageBucket: "mentorship-74ad7.firebasestorage.app",
  messagingSenderId: "1035391211182",
  appId: "1:1035391211182:web:304c3b302b4433b8593f3f",
  measurementId: "G-LQ9EKJ7347"
};

const app = initializeApp(firebaseConfig);

// Export Firebase services
export const auth = getAuth(app);
export const db = getFirestore(app);

// Listen for messages from content script
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'SAVE_ATTENDEE_DATA') {
    const { meetingId, attendee } = message.payload;
    saveAttendeeData(meetingId, attendee)
      .then(() => sendResponse({ status: 'success' }))
      .catch(error => sendResponse({ status: 'error', error: error.message }));
    return true; // Indicates async response
  }
  if (message.type === 'GET_HOST_EMAIL') {
    chrome.identity.getProfileUserInfo((userInfo) => {
      sendResponse({ email: userInfo.email, id: userInfo.id });
    });
    return true;
  }
});

// Function to save attendee data to Firestore
function saveAttendeeData(meetingId, attendee) {
  return db
    .collection('meetings')
    .doc(meetingId)
    .collection('attendees')
    .doc(attendee.email)
    .set(attendee, { merge: true });
} 