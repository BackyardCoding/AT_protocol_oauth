import { useState } from "react";

export default function CreatePost() {
    const [text, setText] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);

    const maxLength = 300;

    async function handlePost() {
        setLoading(true);
        setError(null);
        setSuccess(false);
        try {
            const response = await fetch("http://127.0.0.1:3001/api/post", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                credentials: "include",
                body: JSON.stringify({ text }),
            });
            const data = await response.json() as { error?: string; uri?: string; cid?: string };
            if (data.error) throw new Error(data.error);
            setSuccess(true);
            setText("");
        } catch (err) {
            setError("Failed to create post");
        } finally {
            setLoading(false);
        }
    }

    return (
        <div>
            <h2>💬 Create Post</h2>

            <div style={{
                border: "1px solid #ddd",
                borderRadius: "8px",
                padding: "20px",
            }}>
                <textarea
                    placeholder="What's on your mind?"
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                    maxLength={maxLength}
                    rows={4}
                    style={{
                        width: "100%",
                        padding: "10px",
                        borderRadius: "6px",
                        border: "1px solid #ddd",
                        resize: "none",
                        fontFamily: "sans-serif",
                        fontSize: "1em",
                        boxSizing: "border-box",
                    }}
                />

                {/* Character counter */}
                <p style={{
                    textAlign: "right",
                    color: text.length > maxLength * 0.9 ? "red" : "#888",
                    margin: "5px 0 15px 0",
                    fontSize: "0.9em",
                }}>
                    {text.length}/{maxLength}
                </p>

                {error && <p style={{ color: "red" }}>❌ {error}</p>}
                {success && <p style={{ color: "green" }}>✅ Post created successfully!</p>}

                <button
                    onClick={handlePost}
                    disabled={!text || loading}
                    style={{
                        padding: "10px 20px",
                        borderRadius: "6px",
                        border: "none",
                        background: !text || loading ? "#ccc" : "#0085ff",
                        color: "white",
                        cursor: !text || loading ? "not-allowed" : "pointer",
                        fontSize: "1em",
                    }}>
                    {loading ? "⏳ Posting..." : "🚀 Post"}
                </button>
            </div>
        </div>
    );
}