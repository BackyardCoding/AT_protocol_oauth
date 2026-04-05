# 🤖 AT Protocol OAuth Agent

A web application built with React, TypeScript, Bun and Vite that implements proper OAuth authentication with the AT Protocol network. Any Bluesky user can sign in with their own account and interact with the network through a simple and minimal user interface. 🦋

## ✨ What it does

- 🔐 OAuth authentication — sign in with any Bluesky account
- 📰 Reads and displays your personal Bluesky timeline
- 👤 Views user profiles including follower and post counts
- 💬 Creates posts directly from the browser
- 🔗 Follows and unfollows users

## 🛠️ Tech Stack

- [Bun](https://bun.sh/) — Fast all-in-one JavaScript runtime
- [TypeScript](https://www.typescriptlang.org/) — Programming language
- [React](https://react.dev/) — UI component library
- [Vite](https://vitejs.dev/) — Frontend build tool
- [@atproto/api](https://www.npmjs.com/package/@atproto/api) — Official AT Protocol SDK
- [@atproto/oauth-client-node](https://www.npmjs.com/package/@atproto/oauth-client-node) — AT Protocol OAuth client

## 🏗️ Project Structure
```
AT_protocol_oauth/
├── src/
│   ├── components/
│   │   ├── Feed.tsx        ← displays your Bluesky timeline
│   │   ├── Profile.tsx     ← view and follow/unfollow users
│   │   ├── CreatePost.tsx  ← create posts from the browser
│   │   ├── Login.tsx       ← OAuth login page
│   │   └── Callback.tsx    ← handles OAuth callback
│   ├── App.tsx             ← main app with navigation and auth state
│   └── main.tsx            ← entry point
├── server.ts               ← Bun backend server with OAuth client
├── vite.config.ts          ← Vite configuration
├── index.html              ← single HTML entry point
└── .env                    ← your credentials (never commit this)
```

## 🔐 How OAuth works

Instead of storing your Bluesky password, this app uses OAuth to authenticate users securely:

1. User enters their Bluesky handle and clicks Sign in
2. App redirects them to their PDS (Personal Data Server) to authenticate
3. After login, Bluesky redirects back to the app with an authorization code
4. The app exchanges the code for a session token
5. The token is stored in a secure cookie and used for all future requests

Your password never touches this app. 🔒

## 🚀 Getting Started

### Prerequisites

- Bun installed on your machine
- A Bluesky account

### Installation

Clone the repository:
```bash
git clone https://github.com/BackyardCoding/AT_protocol_oauth.git
cd AT_protocol_oauth
```

Install dependencies:
```bash
bun install
```

Run the app:
```bash
bun run dev
```

Then open your browser and go to `http://localhost:5173` and sign in with your Bluesky handle.

## ⚠️ Important

This project is built for local development using a loopback OAuth client. It is not intended for production use without further configuration.

## 🔗 Related Projects

- [AT Protocol Basic Agent](https://github.com/BackyardCoding/AT_protocol_basic_agent) — the original command line agent
- [AT Protocol Agent UI](https://github.com/BackyardCoding/AT_protocol_ui) — the UI version without OAuth

## 📄 License

[MIT](https://choosealicense.com/licenses/mit/)