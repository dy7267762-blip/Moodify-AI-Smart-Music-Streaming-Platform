# 🎵 MoodSwings

**MoodSwings** is an AI-powered music streaming and discovery web application built with **Node.js, Express, MongoDB, ImageKit, and Google Gemini AI**. It allows artists to upload tracks and create albums with automated AI-driven mood tagging, while enabling listeners to discover music either through standard keyword search or natural language emotional prompts (e.g., *"I feel heartbroken, need something slow"*).

---

## 🌟 Key Features

- **🎭 AI-Driven Mood Discovery**:
  - Natural language search: Describe how you feel, and Google Gemini extracts matching moods from a controlled vocabulary.
  - Automatic song tagging: When an artist uploads a track without tags, Gemini inspects the song title and auto-assigns fitting mood tags.
  - Fallback resilience: If the AI API is unreachable or rate-limited, keyword-based mood extraction ensures searches never fail.
- **🔍 Unified Full-Spectrum Search**:
  - One consolidated search bar simultaneously queries songs, albums, and artist names using case-insensitive regex pattern matching.
- **👥 Role-Based Access Control (RBAC)**:
  - **Listeners (`user`)**: Can search music by title, artist, album, or mood, and stream audio directly via the built-in web player.
  - **Artists (`artist`)**: Access all listener capabilities plus a dedicated dashboard to upload audio tracks (stored in ImageKit) and compile tracks into albums.
- **🛡️ Secure Authentication**:
  - Passwords hashed with `bcryptjs`.
  - Stateless JSON Web Tokens (JWT) stored securely in HTTP-only cookies.
  - Dual-tier authentication middleware tailored for both REST API JSON responses (`401`/`403`) and server-rendered EJS redirects (`/login`).
- **☁️ Cloud Audio Storage**:
  - Direct integration with ImageKit for cloud-hosted audio files with instant streaming playback.
- **🖥️ Server-Side Rendered UI**:
  - Responsive, clean interface powered by EJS and custom CSS with integrated HTML5 `<audio>` players.

---

## 🏗️ Architecture & Tech Stack

| Layer | Technology |
|---|---|
| **Runtime & Framework** | Node.js, Express 5 |
| **Database & ODM** | MongoDB, Mongoose 9 |
| **Artificial Intelligence** | Google Gemini (`gemini-3.1-flash-lite` via Generative Language REST API) |
| **File Storage & CDN** | ImageKit (`@imagekit/nodejs`), Multer (Memory Storage) |
| **Authentication & Security** | JWT (`jsonwebtoken`), `bcryptjs`, `cookie-parser` |
| **Templating & UI** | EJS (Embedded JavaScript), Vanilla CSS |
| **Environment Config** | `dotenv` |

> 📖 **Detailed Architecture Diagrams**: For in-depth Mermaid flowcharts, sequence diagrams, and schema ER diagrams, see [ARCHITECTURE.md](ARCHITECTURE.md).

---

## 📂 Project Structure

```
MOODSWINGS/
├── .env                       # Environment secrets (MongoDB, JWT, ImageKit, Gemini)
├── .env.example               # Template for required environment variables
├── ARCHITECTURE.md            # Visual system architecture with Mermaid diagrams
├── package.json               # Dependencies and scripts
├── server.js                  # App bootstrap: connects to DB and starts HTTP server
└── src/
    ├── app.js                 # Express config, middleware stack, view engine, routes
    ├── constants/
    │   └── moodTags.js        # Standardized vocabulary of 13 supported mood tags
    ├── db/
    │   └── db.js              # MongoDB connection via Mongoose
    ├── middlewares/
    │   └── auth.middleware.js # JWT verification and role checks (API & EJS)
    ├── model/
    │   ├── user.model.js      # User schema (name, email, password, role)
    │   ├── music.model.js     # Music schema (title, url, artist ref, tags)
    │   └── album.model.js     # Album schema (title, artist ref, musics refs)
    ├── controller/
    │   ├── auth.controller.js  # JSON API handlers for authentication
    │   ├── music.controller.js # JSON API handlers for tracks, albums, and searches
    │   ├── page.controller.js  # Web UI controllers for rendering EJS pages & forms
    │   └── services/
    │       ├── auth.service.js    # Registration & login business logic
    │       ├── gemini.service.js  # Google Gemini AI prompts & tag parsing
    │       ├── music.service.js   # Song creation, tag validation & queries
    │       ├── search.service.js  # Unified text search & mood search queries
    │       └── storage.service.js # ImageKit client and file upload pipeline
    ├── public/
    │   └── style.css          # CSS styles for views
    ├── route/
    │   ├── auth.routes.js     # Auth API endpoints (/api/auth)
    │   ├── music.routes.js    # Music & album API endpoints (/api/music)
    │   └── page.routes.js     # Web page routes (/, /login, /register, /dashboard)
    └── views/
        ├── login.ejs          # User/Artist login form
        ├── register.ejs       # Registration form with role selector
        ├── dashboard.ejs      # Unified dashboard (search, audio player, artist tools)
        └── search.ejs         # Standalone search view
```

---

## 🏷️ Controlled Mood Vocabulary

To keep AI categorization predictable and enable high-speed indexing via MongoDB `$in` queries, Gemini is restricted to picking strictly from this fixed vocabulary ([src/constants/moodTags.js](file:///Users/dhirendrakumaryadav/vscode/Node/MOODSWINGS/src/constants/moodTags.js)):

> `happy`, `sad`, `energetic`, `chill`, `romantic`, `angry`, `nostalgic`, `motivational`, `relaxing`, `party`, `heartbreak`, `peaceful`, `Love`

---

## 🚀 Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) (v18 or newer recommended)
- [MongoDB](https://www.mongodb.com/) (Local instance or MongoDB Atlas cluster)
- An [ImageKit](https://imagekit.io/) account for audio hosting
- A [Google AI Studio](https://aistudio.google.com/) Gemini API key

### 1. Installation

Clone the repository and install dependencies:

```bash
git clone <repository-url>
cd MOODSWINGS
npm install
```

### 2. Environment Configuration

Create a `.env` file in the root directory (refer to `.env.example`):

```env
MONGO_URI=mongodb+srv://<username>:<password>@cluster.mongodb.net/<dbname>
JWT_SECRET=your_jwt_secret_key_here
IMAGEKIT_PRIVATE_KEY=private_yourImageKitPrivateKeyHere
GEMINI_API_KEY=your_gemini_api_key_here
```

### 3. Run the Application

Start in development mode with nodemon:
```bash
npm run dev
```

Or start in standard production mode:
```bash
npm start
```

Open your browser and visit: `http://localhost:3000`

---

## 📡 API Reference

### 🔐 Authentication (`/api/auth`)

| Method | Endpoint | Description | Access |
|---|---|---|---|
| `POST` | `/api/auth/register` | Register a new user (`user` or `artist`) | Public |
| `POST` | `/api/auth/login` | Login with username/email & password; sets JWT cookie | Public |
| `POST` | `/api/auth/logout` | Clears JWT session cookie | Public |

### 🎶 Music & Discovery (`/api/music`)

| Method | Endpoint | Description | Access |
|---|---|---|---|
| `GET` | `/api/music/search?q=query` | Search tracks and albums matching title or artist | Authenticated |
| `GET` | `/api/music/search/mood?feeling=text` | Discover songs based on emotional descriptions | Authenticated |
| `POST` | `/api/music/upload` | Upload audio file with optional custom mood tags | Artist Only |
| `POST` | `/api/music/album` | Create a new album with an array of song IDs | Artist Only |
| `GET` | `/api/music/` | Fetch recent tracks (limit 5) | Authenticated |
| `GET` | `/api/music/albums` | Fetch all albums | Authenticated |
| `GET` | `/api/music/albums/:albumId` | Get album details with full populated tracks | Authenticated |

### 🌐 Web Pages (`/`)

| Method | Route | Description |
|---|---|---|
| `GET` | `/` | Redirects to `/dashboard` (if logged in) or `/login` |
| `GET` / `POST` | `/login` | User login interface and handler |
| `GET` / `POST` | `/register` | User registration interface and handler |
| `POST` | `/logout` | Clears cookie and redirects to `/login` |
| `GET` | `/dashboard` | Main interactive dashboard (Search, Player, Artist tools) |
| `POST` | `/dashboard/upload` | Form upload for artists |
| `POST` | `/dashboard/album` | Form album creator for artists |

---

## 🔒 Security Best Practices

- **Never commit `.env`**: Always add `.env` to `.gitignore` to prevent leaking database credentials, API tokens, and JWT signing keys.
- **Production Cookies**: For production HTTPS environments, consider adding `secure: true` and `sameSite: "strict"` to `res.cookie()` options.
