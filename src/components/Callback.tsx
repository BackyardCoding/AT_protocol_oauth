import { useEffect, useState } from "react";

type Props = {
    onSuccess: (did: string) => void;
};

export default function Callback({ onSuccess }: Props) {
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        async function handleCallback() {
            console.log("Full callback URL:", window.location.href);
            console.log("Search params:", window.location.search);
            const params = new URLSearchParams(window.location.search);
            const errorParam = params.get("error");
            const did = params.get("did");
            console.log("Error param:", errorParam);
            console.log("DID param:", did);

            if (errorParam || !did) {
                setError("Authentication failed. Please try again.");
                return;
            }

            try {
                console.log("Restoring session for DID:", did);
                const response = await fetch("http://127.0.0.1:3001/auth/session", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    credentials: "include",
                    body: JSON.stringify({ did }),
                });
                const data = await response.json() as { success?: boolean; did?: string; error?: string };
                console.log("Session response:", data);

                if (data.success && data.did) {
                    onSuccess(data.did);
                    window.location.href = "/";
                } else {
                    setError("Failed to restore session. Please try again.");
                }
            } catch (err) {
                console.error("Callback error:", err);
                setError("Something went wrong. Please try again.");
            }
        }

        handleCallback();
    }, []);

    if (error) return (
        <div style={{ padding: "40px", textAlign: "center", fontFamily: "sans-serif" }}>
            <p>❌ {error}</p>
            <a href="/">Go back</a>
        </div>
    );

    return (
        <div style={{ padding: "40px", textAlign: "center", fontFamily: "sans-serif" }}>
            <p>⏳ Completing sign in...</p>
        </div>
    );
}