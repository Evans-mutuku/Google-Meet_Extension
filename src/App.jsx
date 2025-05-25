import React, { useEffect, useState } from "react";
import "./App.css";

function App() {
  const [meetings, setMeetings] = useState([]);
  const [loading, setLoading] = useState(false);

  async function fetchMeetings() {
    setLoading(true);
    // TODO: Fetch meetings from Firestore via background script or REST API
    setMeetings([
      {
        meetingId: "abc-123",
        timestamp: "2024-06-01T12:00:00Z",
        attendees: [
          { name: "John Doe", email: "john@example.com", duration: 60000 },
          { name: "Jane Smith", email: "jane@example.com", duration: 120000 },
        ],
      },
    ]);
    setLoading(false);
  }

  useEffect(() => {
    fetchMeetings();
  }, []);

  return (
    <main style={{ padding: 16, minWidth: 320 }}>
      <h2>MeetAttendify</h2>
      <button onClick={fetchMeetings} disabled={loading}>
        {loading ? "Loading..." : "Refresh"}
      </button>
      <div style={{ marginTop: 16 }}>
        {meetings.length === 0 ? (
          <p>No meetings loaded.</p>
        ) : (
          meetings.map((m) => (
            <div key={m.meetingId} style={{ marginBottom: 16 }}>
              <strong>Meeting: {m.meetingId}</strong>
              <div>Ended: {new Date(m.timestamp).toLocaleString()}</div>
              <ul>
                {m.attendees.map((a, i) => (
                  <li key={i}>
                    {a.name} ({a.email || "no email"}) -{" "}
                    {Math.round((a.duration || 0) / 1000)}s
                  </li>
                ))}
              </ul>
            </div>
          ))
        )}
      </div>
    </main>
  );
}

export default App;
