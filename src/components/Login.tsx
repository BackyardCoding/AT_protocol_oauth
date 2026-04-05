import { useState } from "react";

export default function Login() {
    const [handle, setHandle] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    async function handleLogin() {
        setLoading(true);
        setError(null);
        try {
            console.log("Attempting login with handle:", handle);
            const response = await fetch("http://127.0.0.1:3001/auth/login", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                credentials: "include",
                body: JSON.stringify({ handle }),
            });
            console.log("Response status:", response.status);
            const data = await response.json() as { url?: string; error?: string };
            console.log("Response data:", data);
            if (data.error) throw new Error(data.error);
            if (data.url) {
                window.location.href = data.url;
            } else {
                setLoading(false);
            }
        } catch (err) {
            console.error("Login error:", err);
            setError("Failed to start login. Please check your handle and try again.");
            setLoading(false);
        }
    }

    return (
        <div style={{
            maxWidth: "400px",
            margin: "100px auto",
            padding: "40px",
            fontFamily: "sans-serif",
            border: "1px solid #ddd",
            borderRadius: "12px",
            textAlign: "center",
        }}>
            <h1>🤖 AT Protocol Agent</h1>
            <p style={{ color: "#888", marginBottom: "30px" }}>
                Sign in with your Bluesky account to continue
            </p>

            <input
                type="text"
                placeholder="your.handle.bsky.social"
                value={handle}
                onChange={(e) => setHandle(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleLogin()}
                style={{
                    width: "100%",
                    padding: "10px",
                    borderRadius: "6px",
                    border: "1px solid #ddd",
                    fontSize: "1em",
                    marginBottom: "10px",
                    boxSizing: "border-box",
                }}
            />

            {error && <p style={{ color: "red", fontSize: "0.9em" }}>❌ {error}</p>}

            <button
                onClick={handleLogin}
                disabled={!handle || loading}
                style={{
                    width: "100%",
                    padding: "12px",
                    borderRadius: "6px",
                    border: "none",
                    background: !handle || loading ? "#ccc" : "#0085ff",
                    color: "white",
                    cursor: !handle || loading ? "not-allowed" : "pointer",
                    fontSize: "1em",
                }}>
                {loading ? "⏳ Redirecting to Bluesky..." : "Sign in with Bluesky"}
            </button>
        </div>
    );
}