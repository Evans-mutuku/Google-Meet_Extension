# Google Meet Attendance Tracker Chrome Extension

## Purpose

Automatically tracks Google Meet attendance for meeting hosts, collecting attendee details and storing them in Firebase Firestore.

## Features

- Authenticates host via Google OAuth
- Tracks join/leave times and total attendance for each participant
- Stores data in Firestore under `/meetings/{meetingId}/attendees/{attendeeId}`
- Popup UI to enable/disable tracking before meeting starts
- Only works for meetings where the user is the host

## Setup

1. Add your Firebase config to `firebase.js`.
2. Add your Google OAuth client ID to `manifest.json`.
3. Add a 128x128 icon at `icons/icon128.png`.
4. Load the `extension` directory as an unpacked extension in Chrome.

## Usage

- Open Google Meet as the host.
- Use the extension popup to enable/disable tracking.
- Attendance data is sent to Firestore in real time.

## Firestore Document Example

```
/meetings/{meetingId}/attendees/{attendeeId}
{
  "fullName": "Jane Doe",
  "email": "jane@example.com",
  "timeJoined": "2024-06-01T10:00:00Z",
  "timeLeft": "2024-06-01T11:00:00Z",
  "totalTimeAttended": 3600
}
```

## Happy Meeting
