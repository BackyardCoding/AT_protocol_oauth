import { useState } from "react";
import Feed from "./components/Feed";
import Profile from "./components/Profile";
import CreatePost from "./components/CreatePost";

export default function App() {
    const [view, setView] = useState<"feed" | "profile" | "post">("feed");

    return (
        <div style={{ maxWidth: "600px", margin: "0 auto", padding: "20px", fontFamily: "sans-serif" }}>
            <h1>🤖 AT Protocol Agent</h1>

            {/* Navigation */}
            <nav style={{ display: "flex", gap: "10px", marginBottom: "20px" }}>
                <button onClick={() => setView("feed")}>📰 Feed</button>
                <button onClick={() => setView("profile")}>👤 Profile</button>
                <button onClick={() => setView("post")}>💬 Create Post</button>
            </nav>

            {/* Views */}
            {view === "feed" && <Feed />}
            {view === "profile" && <Profile />}
            {view === "post" && <CreatePost />}
        </div>
    );
}