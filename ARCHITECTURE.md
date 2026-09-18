# 🏛️ MoodSwings System Architecture

This document provides a comprehensive technical architecture overview of **MoodSwings**, illustrated using Mermaid diagrams.

---

## 1. High-Level System Architecture

MoodSwings follows a modular Layered MVC (Model-View-Controller) architecture with a dedicated **Services Layer** isolating third-party integrations (Google Gemini AI, ImageKit) and business logic from transport controllers.

```mermaid
flowchart TD
    subgraph Clients["Clients"]
        Browser["Web Browser (EJS UI)"]
        ApiClient["API Consumers (REST / JSON)"]
    end

    subgraph EntryPoint["Entry & Server Layer"]
        Server["server.js (HTTP Listener)"]
        App["src/app.js (Express Application)"]
    end

    subgraph Middlewares["Middlewares Layer"]
        CookieParser["cookie-parser"]
        BodyParsers["express.json / urlencoded"]
        AuthMid["auth.middleware.js (attachUser / authUser / authArtist)"]
        MulterMid["multer (MemoryStorage for audio uploads)"]
    end

    subgraph Routing["Routing Layer"]
        PageRoutes["route/page.routes.js (/, /login, /dashboard)"]
        AuthRoutes["route/auth.routes.js (/api/auth)"]
        MusicRoutes["route/music.routes.js (/api/music)"]
    end

    subgraph Controllers["Controller Layer"]
        PageCtrl["controller/page.controller.js"]
        AuthCtrl["controller/auth.controller.js"]
        MusicCtrl["controller/music.controller.js"]
    end

    subgraph Services["Services Layer (Business Logic)"]
        AuthSvc["services/auth.service.js"]
        MusicSvc["services/music.service.js"]
        SearchSvc["services/search.service.js"]
        GeminiSvc["services/gemini.service.js"]
        StorageSvc["services/storage.service.js"]
    end

    subgraph Persistence["Data Persistence & External Services"]
        MongoDB[("MongoDB Database\n(Users, Musics, Albums)")]
        ImageKit["ImageKit.io (Audio CDN Hosting)"]
        GeminiAPI["Google Gemini 3.1 Flash-Lite API"]
    end

    Browser -->|HTTP GET/POST| Server
    ApiClient -->|JSON Requests| Server
    Server --> App

    App --> BodyParsers
    App --> CookieParser
    App --> Middlewares

    Middlewares --> Routing
    PageRoutes --> PageCtrl
    AuthRoutes --> AuthCtrl
    MusicRoutes --> MusicCtrl

    PageCtrl --> Services
    AuthCtrl --> Services
    MusicCtrl --> Services

    AuthSvc --> MongoDB
    MusicSvc --> StorageSvc
    MusicSvc --> GeminiSvc
    MusicSvc --> MongoDB
    SearchSvc --> GeminiSvc
    SearchSvc --> MongoDB

    StorageSvc --> ImageKit
    GeminiSvc --> GeminiAPI
```

---

## 2. Entity-Relationship (ER) Diagram

The data model uses Mongoose schemas with relational referencing between users (artists), individual music tracks, and curated albums.

```mermaid
erDiagram
    USER ||--o{ MUSIC : "uploads / composes"
    USER ||--o{ ALBUM : "creates / owns"
    ALBUM }o--o{ MUSIC : "contains tracks"

    USER {
        ObjectId _id PK
        string name "Unique, Required"
        string email "Unique, Required"
        string password "Bcrypt Hashed"
        string role "user | artist"
    }

    MUSIC {
        ObjectId _id PK
        string title "Required"
        string url "ImageKit CDN URL"
        ObjectId artist FK "Ref: user"
        array tags "Subset of 13 MOOD_TAGS"
    }

    ALBUM {
        ObjectId _id PK
        string title "Required"
        ObjectId artist FK "Ref: user"
        array musics FK "Refs: music[]"
    }
```

---

## 3. Authentication & Dual-Tier Middleware Architecture

The application handles both server-rendered UI requests (which need browser redirects upon auth failure) and headless API requests (which require JSON status codes `401`/`403`).

```mermaid
flowchart TD
    Req["Incoming HTTP Request"] --> ReadToken["Extract JWT from req.cookies.token"]

    ReadToken --> RouteType{"Route Type?"}

    subgraph APIRoutes["API Route Pipeline (/api/...)"]
        RouteType -->|API Route| CheckAPIToken{"Token exists?"}
        CheckAPIToken -->|No| Return401["401 Unauthorized (JSON)"]
        CheckAPIToken -->|Yes| VerifyAPI["jwt.verify(token, JWT_SECRET)"]
        VerifyAPI -->|Invalid| Return401
        VerifyAPI -->|Valid| RoleCheck{"Requires Artist?"}
        RoleCheck -->|Yes and role != artist| Return403["403 Forbidden (JSON)"]
        RoleCheck -->|Matches| AllowAPI["Call next() -> API Controller"]
    end

    subgraph WebRoutes["Web Page Pipeline (EJS UI)"]
        RouteType -->|Web Route| AttachUser["attachUser Middleware"]
        AttachUser --> CheckCookie{"Token Valid?"}
        CheckCookie -->|Yes| SetUser["Set req.user & res.locals.currentUser"]
        CheckCookie -->|No| SetNull["req.user = null"]
        SetUser --> TargetPage{"Target Web Route?"}
        SetNull --> TargetPage

        TargetPage -->|/login, /register| RenderAuthPage["Render Login / Register View"]
        TargetPage -->|/dashboard| RequireLogin{"req.user exists?"}
        RequireLogin -->|No| RedirectLogin["Redirect to /login"]
        RequireLogin -->|Yes| RenderDashboard["Render dashboard.ejs"]

        TargetPage -->|/dashboard/upload or /album| RequireArtist{"role == artist?"}
        RequireArtist -->|No| RedirectDashError["Redirect to /dashboard with error query"]
        RequireArtist -->|Yes| ProcessArtistAction["Process Upload / Album Creation"]
    end
```

---

## 4. Track Upload & AI Auto-Tagging Flow

When an artist uploads a track, tags can either be supplied manually or derived through **Gemini 3.1 Flash-Lite** against the controlled 13-tag vocabulary.

```mermaid
sequenceDiagram
    autonumber
    actor Artist as Artist (Browser)
    participant Server as Express (route/page.routes.js)
    participant Multer as Multer Memory Storage
    participant MusicSvc as music.service.js
    participant StorageSvc as storage.service.js
    participant ImageKit as ImageKit CDN
    participant GeminiSvc as gemini.service.js
    participant Gemini as Google Gemini REST API
    participant DB as MongoDB (musicModel)

    Artist->>Server: POST /dashboard/upload (multipart: title, tags, audio file)
    Server->>Multer: Buffer audio in memory
    Multer-->>Server: req.file with audio buffer
    Server->>MusicSvc: createSong({ title, rawTags, file, artistId })

    par Cloud Media Storage
        MusicSvc->>StorageSvc: uploadFile(base64Buffer)
        StorageSvc->>ImageKit: files.upload({ folder: "yt-complete-backend/music" })
        ImageKit-->>StorageSvc: Returns CDN URL
        StorageSvc-->>MusicSvc: CDN URL
    and AI Tag Generation (if tags omitted)
        alt Tags Provided by Artist
            MusicSvc->>MusicSvc: parseTags() & filter against MOOD_TAGS
        else Tags Left Blank
            MusicSvc->>GeminiSvc: generateTagsForSong(title)
            GeminiSvc->>Gemini: POST generateContent (Prompt + Title + Allowed Tags)
            alt Gemini Success
                Gemini-->>GeminiSvc: JSON string array e.g. ["chill", "romantic"]
                GeminiSvc->>GeminiSvc: Filter against MOOD_TAGS whitelist
                GeminiSvc-->>MusicSvc: Whitelisted mood tags
            else Gemini Failure / Rate Limit
                Gemini-->>GeminiSvc: Error response
                GeminiSvc-->>MusicSvc: Fallback empty tags []
            end
        end
    end

    MusicSvc->>DB: musicModel.create({ title, url, artist, tags })
    DB-->>MusicSvc: Saved Music Document
    MusicSvc-->>Server: Complete Song Object
    Server-->>Artist: 302 Redirect to /dashboard?success=Song+uploaded
```

---

## 5. Search Engine Architecture

MoodSwings provides two distinct search mechanisms handled by [`search.service.js`](file:///Users/dhirendrakumaryadav/vscode/Node/MOODSWINGS/src/controller/services/search.service.js):

### A. Unified Text Search Data Flow

Searches songs and albums simultaneously by title or matching artist name in a single pass.

```mermaid
flowchart TD
    UserQuery["User Input: query string (e.g. 'coldplay')"] --> Escape["Regex Escaped Pattern (Case-Insensitive)"]

    Escape --> ArtistSearch["Step 1: userModel.find({ name: regex }).select('_id')"]
    ArtistSearch --> ArtistIds["Extract matching artistIds[]"]

    ArtistIds --> SongQuery["Step 2: musicModel.find(\n  $or: [{ title: regex }, { artist: { $in: artistIds } }]\n).populate('artist')"]
    ArtistIds --> AlbumQuery["Step 3: albumModel.find(\n  $or: [{ title: regex }, { artist: { $in: artistIds } }]\n).populate('artist').populate('musics')"]

    SongQuery --> CombinedResult["Unified Search Result: { songs, albums }"]
    AlbumQuery --> CombinedResult
    CombinedResult --> RenderResult["Render in dashboard.ejs or return as JSON"]
```

### B. Natural Language Mood Search Sequence

Translates subjective emotional text into structured database queries.

```mermaid
sequenceDiagram
    autonumber
    actor Listener as Listener
    participant Controller as page.controller.js / music.controller.js
    participant SearchSvc as search.service.js
    participant GeminiSvc as gemini.service.js
    participant GeminiAPI as Gemini 3.1 Flash-Lite
    participant DB as MongoDB

    Listener->>Controller: GET /dashboard?feeling="I am overwhelmed and want to sleep"
    Controller->>SearchSvc: searchByMood("I am overwhelmed and want to sleep")
    SearchSvc->>GeminiSvc: extractMoodTagsFromFeeling(feelingText)

    GeminiSvc->>GeminiAPI: POST prompt with strict MOOD_TAGS list
    alt Gemini Success
        GeminiAPI-->>GeminiSvc: ["relaxing", "peaceful"]
        GeminiSvc-->>SearchSvc: tagsUsed: ["relaxing", "peaceful"]
    else Gemini Error / Offline
        GeminiAPI-->>GeminiSvc: Failed request
        GeminiSvc->>SearchSvc: Fallback triggered
        SearchSvc->>SearchSvc: Keyword scan in feeling text against MOOD_TAGS
    end

    SearchSvc->>DB: musicModel.find({ tags: { $in: tagsUsed } }).populate("artist")
    DB-->>SearchSvc: Matched songs list
    SearchSvc-->>Controller: { tagsUsed, songs }
    Controller-->>Listener: Display songs and active mood badges
```

---

## 6. Directory and Component Map

```mermaid
graph LR
    subgraph Root["Project Root"]
        ServerFile["server.js"]
        EnvFile[".env"]
    end

    subgraph Src["src/"]
        AppFile["app.js"]
        Constants["constants/\nmoodTags.js"]
        DBFolder["db/\ndb.js"]
        MiddlewaresFolder["middlewares/\nauth.middleware.js"]
        ModelsFolder["model/\nuser, music, album"]
        ControllersFolder["controller/\nauth, music, page"]
        ServicesFolder["controller/services/\nauth, gemini, music, search, storage"]
        RoutesFolder["route/\nauth, music, page"]
        ViewsFolder["views/\nlogin, register, dashboard, search"]
        PublicFolder["public/\nstyle.css"]
    end

    ServerFile --> DBFolder
    ServerFile --> AppFile
    AppFile --> MiddlewaresFolder
    AppFile --> RoutesFolder
    AppFile --> ViewsFolder
    AppFile --> PublicFolder

    RoutesFolder --> ControllersFolder
    ControllersFolder --> ServicesFolder
    ServicesFolder --> ModelsFolder
    ServicesFolder --> Constants
    ModelsFolder --> DBFolder
```
