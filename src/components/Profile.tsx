import { useState } from "react";

type Profile = {
    handle: string;
    displayName: string;
    bio: string;
    followers: number;
    following: number;
    posts: number;
};

export default function Profile() {
    const [handle, setHandle] = useState("");
    const [profile, setProfile] = useState<Profile | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [following, setFollowing] = useState(false);

    async function fetchProfile() {
        setLoading(true);
        setError(null);
        try {
            const response = await fetch(`http://127.0.0.1:3001/api/profile?handle=${handle}`, {
                credentials: "include",
            });
            const data = await response.json() as Profile & { error?: string };
            if (data.error) throw new Error(data.error);
            setProfile(data);
        } catch (err) {
            setError("Failed to load profile");
        } finally {
            setLoading(false);
        }
    }

    async function handleFollow() {
        try {
            await fetch("http://127.0.0.1:3001/api/follow", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                credentials: "include",
                body: JSON.stringify({ handle }),
            });
            setFollowing(true);
        } catch (err) {
            setError("Failed to follow user");
        }
    }

    async function handleUnfollow() {
        try {
            await fetch("http://127.0.0.1:3001/api/unfollow", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                credentials: "include",
                body: JSON.stringify({ handle }),
            });
            setFollowing(false);
        } catch (err) {
            setError("Failed to unfollow user");
        }
    }

    return (
        <div>
            <h2>👤 Profile</h2>

            {/* Search */}
            <div style={{ display: "flex", gap: "10px", marginBottom: "20px" }}>
                <input
                    type="text"
                    placeholder="Enter a handle e.g. jay.bsky.social"
                    value={handle}
                    onChange={(e) => setHandle(e.target.value)}
                    style={{ flex: 1, padding: "8px", borderRadius: "6px", border: "1px solid #ddd" }}
                />
                <button onClick={fetchProfile} disabled={!handle || loading}>
                    {loading ? "⏳ Loading..." : "🔍 Search"}
                </button>
            </div>

            {error && <p>❌ {error}</p>}

            {/* Profile card */}
            {profile && (
                <div style={{
                    border: "1px solid #ddd",
                    borderRadius: "8px",
                    padding: "20px",
                }}>
                    <h3 style={{ margin: "0 0 5px 0" }}>{profile.displayName}</h3>
                    <p style={{ color: "#888", margin: "0 0 10px 0" }}>@{profile.handle}</p>
                    <p style={{ margin: "0 0 15px 0" }}>{profile.bio}</p>

                    {/* Stats */}
                    <div style={{ display: "flex", gap: "20px", marginBottom: "15px" }}>
                        <span>👥 {profile.followers} followers</span>
                        <span>➡️ {profile.following} following</span>
                        <span>📝 {profile.posts} posts</span>
                    </div>

                    {/* Follow/Unfollow */}
                    <button
                        onClick={following ? handleUnfollow : handleFollow}
                        style={{
                            padding: "8px 16px",
                            borderRadius: "6px",
                            border: "none",
                            background: following ? "#ff4444" : "#0085ff",
                            color: "white",
                            cursor: "pointer",
                        }}>
                        {following ? "Unfollow" : "Follow"}
                    </button>
                </div>
            )}
        </div>
    );
}