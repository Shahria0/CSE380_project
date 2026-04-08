# EduBridge — MERN Stack v2.0

> Academic Collaboration Platform rewritten from PHP/MySQL to **MongoDB + Express + React + Node.js**

---

## 🗂️ Project Structure

```
edubridge/
├── client/                    ← React frontend (Create React App)
│   ├── public/
│   │   └── index.html         ← HTML shell React mounts into
│   └── src/
│       ├── api/
│       │   └── client.js      ← Axios instance + all API calls
│       ├── components/
│       │   ├── Navbar.js      ← Top nav (auth-aware)
│       │   ├── Footer.js      ← Site footer
│       │   ├── PostCard.js    ← Reusable post card
│       │   └── ProtectedRoute.js ← Redirects to /login if not auth'd
│       ├── context/
│       │   └── AuthContext.js ← Global auth state (React Context + JWT)
│       ├── pages/
│       │   ├── Home.js        ← Public landing page
│       │   ├── Login.js       ← Sign in form
│       │   ├── Register.js    ← Sign up (student/alumni)
│       │   ├── ForgotPassword.js ← 3-step OTP reset
│       │   ├── Dashboard.js   ← Main feed (protected)
│       │   ├── Listings.js    ← Browse + filter posts
│       │   ├── PostDetail.js  ← Single post + comments
│       │   ├── CreatePost.js  ← New post form (protected)
│       │   ├── EditPost.js    ← Edit own post (protected)
│       │   ├── Profile.js     ← User profile page
│       │   ├── Settings.js    ← Account settings (protected)
│       │   └── Alumni.js      ← Alumni experience listing
│       ├── App.js             ← Route definitions
│       ├── index.js           ← React entry point
│       └── index.css          ← Global styles + CSS variables
│
└── server/                    ← Express backend (Node.js)
    ├── config/
    │   └── db.js              ← MongoDB connection via Mongoose
    ├── middleware/
    │   └── auth.js            ← JWT protect + optionalAuth middleware
    ├── models/
    │   ├── User.js            ← User schema (bcrypt, virtuals, hooks)
    │   └── Post.js            ← Post schema (text index, embedded comments)
    ├── routes/
    │   ├── auth.js            ← /api/auth/* (login, register, OTP reset)
    │   ├── posts.js           ← /api/posts/* (CRUD + comments + interest)
    │   └── users.js           ← /api/users/* (profile, password, save)
    ├── .env.example           ← Copy to .env and fill in values
    ├── index.js               ← Express app entry point
    └── package.json
```

---

## ⚡ Quick Start (Local Development)

### Prerequisites
- **Node.js** v18+ — https://nodejs.org
- **MongoDB** (choose one):
  - Local: Install MongoDB Community — https://www.mongodb.com/try/download/community
  - Cloud: Create free cluster at https://www.mongodb.com/atlas (recommended for beginners)

### Step 1 — Clone / extract the project

```bash
cd edubridge
```

### Step 2 — Configure the server

```bash
cd server
cp .env.example .env
```

Open `.env` and set:
```
MONGO_URI=mongodb://localhost:27017/edubridge   # or your Atlas URI
JWT_SECRET=any-long-random-string-here
CLIENT_URL=http://localhost:3000
```

### Step 3 — Install dependencies

```bash
# From the root edubridge/ folder:
cd server && npm install
cd ../client && npm install
```

### Step 4 — Start the servers

Open **two terminal windows**:

**Terminal 1 — Backend:**
```bash
cd server
npm run dev          # nodemon auto-restarts on file changes
# Server starts at http://localhost:5000
```

**Terminal 2 — Frontend:**
```bash
cd client
npm start            # React dev server with hot reload
# App opens at http://localhost:3000
```

Visit **http://localhost:3000** — the app is running! 🎉

---

## 🔌 API Reference

All endpoints are prefixed with `/api`.

### Authentication

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/auth/register` | — | Create account |
| POST | `/auth/login` | — | Login, get JWT |
| GET | `/auth/me` | ✅ | Get current user |
| POST | `/auth/forgot-password` | — | Send OTP to email |
| POST | `/auth/verify-otp` | — | Validate OTP |
| POST | `/auth/reset-password` | — | Set new password |

### Posts

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/posts` | optional | List posts (filter: `type`, `search`, `department`, `page`) |
| POST | `/posts` | ✅ | Create post |
| GET | `/posts/:id` | optional | Get single post + comments |
| PUT | `/posts/:id` | ✅ owner | Update post |
| DELETE | `/posts/:id` | ✅ owner | Delete post |
| POST | `/posts/:id/comment` | ✅ | Add comment |
| POST | `/posts/:id/interest` | ✅ | Toggle interest |
| POST | `/posts/:id/view` | — | Increment view count |

### Users

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/users/:id` | — | Get public profile |
| GET | `/users/:id/posts` | — | Get user's posts |
| PUT | `/users/profile` | ✅ | Update profile |
| PUT | `/users/password` | ✅ | Change password |
| POST | `/users/save-post/:id` | ✅ | Toggle save post |
| DELETE | `/users/account` | ✅ | Deactivate account |

---

## 🔑 Key Architectural Decisions

### Why MERN instead of PHP/MySQL?

| Concern | PHP/HTML | MERN |
|---------|----------|------|
| **Auth** | PHP sessions → session_start() | JWT tokens → stateless, works on any server |
| **API** | PHP files return HTML | Express returns JSON → any frontend can consume it |
| **Routing** | Page refresh on every navigation | React Router → instant client-side navigation |
| **State** | PHP variables lost between requests | React Context → persistent state across components |
| **Error UX** | PHP redirects with ?error= in URL | Inline error messages, no redirect needed |
| **Real-time** | Not possible without polling | WebSocket upgrade path is straightforward |

### Security improvements over the original
1. **JWT instead of PHP sessions** — tokens are self-contained, signed, and expiry-enforced
2. **Bcrypt salt rounds = 12** — original schema used a weaker hash
3. **Rate limiting** — auth routes limited to 20 requests/15 min per IP
4. **OTP hashing** — OTPs are hashed before storage (original stored plain OTP)
5. **select: false on password** — password never accidentally included in API responses
6. **Generic auth error messages** — prevents user enumeration attacks
7. **optionalAuth middleware** — public routes don't reject unauthenticated users
8. **CORS configured** — only your frontend domain can make API requests

### MongoDB vs MySQL
- **Embedded comments** in Post documents → fewer JOIN queries → faster reads
- **Text indexes** on title/description/tags → full-text search built-in
- **Flexible schema** → alumni and student fields coexist in one User collection
- **$inc for view counters** → atomic update avoids race conditions

---

## 🚀 Deploying to Production

### Frontend → Vercel (free)
```bash
cd client
npm run build          # Creates optimized build in /build folder
# Then connect your GitHub repo to vercel.com
# Set REACT_APP_API_URL=https://your-backend.com/api in Vercel env vars
```

### Backend → Railway or Render (free tier)
```bash
# Set these environment variables on your hosting platform:
MONGO_URI=mongodb+srv://...    # MongoDB Atlas connection string
JWT_SECRET=your-secret
CLIENT_URL=https://your-frontend.vercel.app
NODE_ENV=production
PORT=5000
```

---

## 🧑‍💻 Development Tips

### Test the API directly
```bash
# Check server is running:
curl http://localhost:5000/api/health

# Register a test user:
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"firstName":"Test","lastName":"User","email":"test@uni.edu","password":"Password1!","role":"student"}'
```

### See OTP in development
When you trigger forgot-password, check your **server terminal** — the OTP is logged:
```
📧 OTP for test@uni.edu: 423819
```

### MongoDB GUI
Install **MongoDB Compass** (free) to visually browse your database:
https://www.mongodb.com/products/compass

---

## 📚 Learning Resources

| Topic | Resource |
|-------|----------|
| React (beginner) | https://react.dev/learn |
| React Router v6 | https://reactrouter.com/en/main/start/tutorial |
| Express.js | https://expressjs.com/en/guide/routing.html |
| Mongoose | https://mongoosejs.com/docs/guide.html |
| JWT explained | https://jwt.io/introduction |
| MongoDB Atlas | https://www.mongodb.com/docs/atlas/getting-started/ |
