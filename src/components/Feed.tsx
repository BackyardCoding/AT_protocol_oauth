import { useState, useEffect } from "react";

type Post = {
    handle: string;
    displayName: string;
    text: string;
    likeCount: number;
    repostCount: number;
};

export default function Feed() {
    const [posts, setPosts] = useState<Post[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        async function fetchFeed() {
            try {
                const response = await fetch("http://127.0.0.1:3001/api/feed", {
                    credentials: "include",
                });
                const data = await response.json() as Post[] | { error: string };
                if ("error" in data) throw new Error(data.error);
                setPosts(data);
            } catch (err) {
                setError("Failed to load feed");
            } finally {
                setLoading(false);
            }
        }
        fetchFeed();
    }, []);

    if (loading) return <p>⏳ Loading feed...</p>;
    if (error) return <p>❌ {error}</p>;

    return (
        <div>
            <h2>📰 Your Feed</h2>
            {posts.map((post, index) => (
                <div key={index} style={{
                    border: "1px solid #ddd",
                    borderRadius: "8px",
                    padding: "15px",
                    marginBottom: "10px",
                }}>
                    <p style={{ fontWeight: "bold", margin: "0 0 5px 0" }}>
                        👤 {post.displayName}
                        <span style={{ fontWeight: "normal", color: "#888", marginLeft: "8px" }}>
                            @{post.handle}
                        </span>
                    </p>
                    <p style={{ margin: "0 0 10px 0" }}>{post.text}</p>
                    <p style={{ margin: 0, color: "#888", fontSize: "0.9em" }}>
                        ❤️ {post.likeCount} likes · 🔁 {post.repostCount} reposts
                    </p>
                </div>
            ))}
        </div>
    );
}