import { useState, useEffect } from "react";
import Feed from "./components/Feed";
import Profile from "./components/Profile";
import CreatePost from "./components/CreatePost";
import Login from "./components/Login";
import Callback from "./components/Callback";

type User = {
    did: string;
} | null;

export default function App() {
    const [view, setView] = useState<"feed" | "profile" | "post">("feed");
    const [user, setUser] = useState<User>(null);
    const [loading, setLoading] = useState(true);

    // Handle callback route before anything else
    if (window.location.pathname === "/callback") {
        return <Callback onSuccess={(did) => setUser({ did })} />;
    }

    useEffect(() => {
        async function checkSession() {
            try {
                const response = await fetch("http://127.0.0.1:3001/auth/me", {
                    credentials: "include",
                });
                const data = await response.json() as { user: User };
                setUser(data.user);
            } catch {
                setUser(null);
            } finally {
                setLoading(false);
            }
        }
        checkSession();
    }, []);

    async function handleLogout() {
        await fetch("http://127.0.0.1:3001/auth/logout", {
            method: "POST",
            credentials: "include",
        });
        setUser(null);
    }

    if (loading) return <p style={{ padding: "20px" }}>⏳ Loading...</p>;

    if (!user) return <Login />;

    return (
        <div style={{ maxWidth: "600px", margin: "0 auto", padding: "20px", fontFamily: "sans-serif" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
                <h1>🤖 AT Protocol Agent</h1>
                <button
                    onClick={handleLogout}
                    style={{
                        padding: "8px 16px",
                        borderRadius: "6px",
                        border: "none",
                        background: "#ff4444",
                        color: "white",
                        cursor: "pointer",
                    }}>
                    🚪 Logout
                </button>
            </div>

            <nav style={{ display: "flex", gap: "10px", marginBottom: "20px" }}>
                <button onClick={() => setView("feed")}>📰 Feed</button>
                <button onClick={() => setView("profile")}>👤 Profile</button>
                <button onClick={() => setView("post")}>💬 Create Post</button>
            </nav>

            {view === "feed" && <Feed />}
            {view === "profile" && <Profile />}
            {view === "post" && <CreatePost />}
        </div>
    );
}