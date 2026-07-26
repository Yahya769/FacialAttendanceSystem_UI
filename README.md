# Facial Attendance System — Frontend

React (Vite) single-page application that handles webcam-based face
capture and the attendance/registration user interface.

## Objective

To provide a simple, contactless UI where a user can:

- Register once by capturing their face along with their identity details.
- Look at the camera afterward to have their attendance automatically
  captured and marked as a check-in or check-out via the backend API.

## Required Libraries

| Library                        | Purpose                                          |
| ------------------------------ | ------------------------------------------------ |
| `react` / `react-dom`          | Core UI framework                                |
| `vite`                         | Dev server / build tool                          |
| `axios` (or `fetch`)           | Sending captured photos to the FastAPI backend   |
| `react-router-dom`             | Navigation between registration/attendance pages |

> Confirm against your actual `package.json` — add/remove rows above to
> match the dependencies your project actually uses (e.g. a webcam
> component library if you use one instead of raw `getUserMedia`).

## Installation Steps

1. **Clone the repository** and move into the frontend folder:

   ```bash
   git clone <your-repo-url>
   cd facial-attendance-system/frontend
   ```

2. **Install Node.js** (v18+ recommended) if not already installed.

3. **Install dependencies:**

   ```bash
   npm install
   ```

4. **Configure the backend URL:**
   Make sure the API base URL used in the frontend (e.g. in an `.env` file
   as `VITE_API_URL=http://127.0.0.1:8000`, or hardcoded in an API config
   file) matches wherever your FastAPI backend is running.

## How to Run

From the `frontend/` directory:

```bash
npm run dev
```

- The app will be available at: `http://localhost:5173`
- Make sure the **backend server is already running** (see the backend
  README) before using the app, since the frontend depends on it for
  registration and attendance requests.
- Allow camera permissions when prompted by the browser.

## Expected Output

- The Vite dev server starts and prints a local URL
  (`http://localhost:5173`) in the terminal.
- Opening that URL in a browser shows the app UI with a live webcam
  preview.
- **Registration page:** entering identity details and capturing a photo
  successfully registers a new user (confirmed by a success message and
  a new row in the backend's `users` table).
- **Attendance page:** after a short countdown, a photo is captured
  automatically, sent to the backend, and the UI displays whether the
  event was recorded as a **check-in** or **check-out**, along with the
  timestamp returned by the API.
