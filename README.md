# VidBrief

VidBrief is a local full-stack starter project. Paste a YouTube video URL to retrieve its captions and generate a video brief with a Python multi-agent pipeline.

## Project layout

```text
.
├── backend/
│   ├── app/
│   │   ├── main.py         # FastAPI routes and URL validation
│   │   ├── transcripts.py  # YouTube caption retrieval
│   │   └── pipeline.py     # Summary, key points, outline/script agents
│   ├── .env.example
│   └── requirements.txt
├── frontend/
│   ├── src/                # React interface
│   ├── index.html
│   └── vite.config.js      # Proxies /api requests to FastAPI
├── mobile/
│   ├── App.js              # Expo / React Native iOS app
│   ├── app.json
│   └── .env.example        # Public backend URL for the app
└── .vscode/tasks.json      # Optional run-both task
```

## What you need

- Python 3.11 or newer
- Node.js 20 or newer
- A Gemini API key for AI-generated analysis (optional; without it, transcript-based fallback content is shown)

## Run from VS Code

1. Open this project folder in VS Code.
2. In a terminal, prepare the backend:

   ```bash
   cd backend
   python3 -m venv .venv
   ```

   Activate the environment (`source .venv/bin/activate` on macOS/Linux, or `.venv\\Scripts\\Activate.ps1` in Windows PowerShell), then install dependencies and create your local settings file:

   ```bash
   pip install -r requirements.txt
   cp .env.example .env
   ```

   Open `backend/.env` and add your Gemini key to `GEMINI_API_KEY=`. Get a key from [Google AI Studio](https://aistudio.google.com/apikey). You can leave it blank to try the transcript fallback. The model defaults to `gemini-3.8-flash`; change `GEMINI_MODEL` if you want another model available to your API key.

3. In a second terminal, install and start the webpage:

   ```bash
   cd frontend
   npm install
   npm run dev
   ```

4. In the first terminal, start the API from the `backend` folder:

   ```bash
   python3 -m uvicorn app.main:app --reload
   ```

5. Open the local address printed by Vite (usually `http://localhost:5173`). The API docs are at `http://localhost:8000/docs`.

You can also select **Terminal → Run Task → VidBrief: run locally** after dependencies are installed and your VS Code Python interpreter is set to `backend/.venv`.

## Try the functionality

Paste a public YouTube URL in the webpage. The backend validates the URL, gets the video title, retrieves available captions, and returns:

- A concise overview
- Main takeaways
- An ordered outline
- A script-style recap
- The retrieved transcript

The analysis pipeline runs three Gemini calls in parallel (summary, takeaways, and outline/script). The model key stays in the backend `.env` and is never sent to the browser. The backend uses Google's `google-genai` Python SDK.

## Run the iOS app

The `mobile/` app uses Expo and the same FastAPI `/api/analyze` endpoint as the webpage.

1. Deploy the backend first, or start it locally.
2. In a terminal:

   ```bash
   cd mobile
   npm install
   cp .env.example .env
   ```

3. Edit `mobile/.env` and set `EXPO_PUBLIC_API_URL` to the backend base URL without a trailing slash. For Vercel, use the backend deployment URL, for example `https://your-backend.vercel.app`.
4. Start the Expo development server:

   ```bash
   npx expo start
   ```

   Press `i` to open the iOS Simulator, or scan the QR code using Expo Go on an iPhone. For the simulator, Xcode and an iOS Simulator runtime must be installed. A physical iPhone and development computer should be on the same Wi-Fi network when using a local backend.

Only the backend URL belongs in `mobile/.env`; never put `GEMINI_API_KEY` in the iOS app. Expo public variables are included in the app bundle and can be read by users. See the [Expo environment variables guide](https://docs.expo.dev/guides/environment-variables/).

## Local API

- `GET /api/health` — check that the backend is running
- `POST /api/analyze` — analyze `{ "url": "https://www.youtube.com/watch?v=..." }`

Caption retrieval depends on the video's caption availability and YouTube access from your network. The app analyzes captions; it does not inspect visual content that is not described in the transcript.

Website:
<img width="1468" height="783" alt="Screenshot 2026-11-22 at 21 59 33" src="https://github.com/user-attachments/assets/4316ab5c-fcd5-4e32-8244-f900e5658442" />


