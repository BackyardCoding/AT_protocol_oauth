import { NodeOAuthClient, buildAtprotoLoopbackClientMetadata } from "@atproto/oauth-client-node";
import { AtpAgent } from "@atproto/api";
import { parse, serialize } from "cookie";

// ============================================
// OAuth Client Setup
// ============================================

const globalAuth = globalThis as unknown as {
    stateStore: Map<string, any>;
    sessionStore: Map<string, any>;
};

globalAuth.stateStore ??= new Map();
globalAuth.sessionStore ??= new Map();

let oauthClient: NodeOAuthClient | null = null;

async function getOAuthClient(): Promise<NodeOAuthClient> {
    if (oauthClient) return oauthClient;

    oauthClient = new NodeOAuthClient({
        clientMetadata: buildAtprotoLoopbackClientMetadata({
            scope: "atproto transition:generic",
            redirect_uris: ["http://127.0.0.1:3001/auth/callback"],
        }),
        stateStore: {
            async get(key: string) { return globalAuth.stateStore.get(key); },
            async set(key: string, value: any) { globalAuth.stateStore.set(key, value); },
            async del(key: string) { globalAuth.stateStore.delete(key); },
        },
        sessionStore: {
            async get(key: string) { return globalAuth.sessionStore.get(key); },
            async set(key: string, value: any) { globalAuth.sessionStore.set(key, value); },
            async del(key: string) { globalAuth.sessionStore.delete(key); },
        },
    });

    return oauthClient;
}

// ============================================
// Helper functions
// ============================================

function getSessionKey(req: Request): string | null {
    const cookies = parse(req.headers.get("cookie") || "");
    return cookies.session || null;
}

async function getAgentForRequest(req: Request) {
    const client = await getOAuthClient();
    const sessionKey = getSessionKey(req);
    if (!sessionKey) return null;
    try {
        const oauthSession = await client.restore(sessionKey);
        const agent = new AtpAgent({ service: oauthSession.serverMetadata.issuer });
        agent.sessionManager = oauthSession;
        return agent;
    } catch {
        return null;
    }
}

// ============================================
// Server
// ============================================

const server = Bun.serve({
    port: 3001,
    async fetch(req) {
        const url = new URL(req.url);
        const origin = req.headers.get("origin") || "http://localhost:5173";

        const headers = {
            "Content-Type": "application/json",
            "Access-Control-Allow-Origin": origin,
            "Access-Control-Allow-Credentials": "true",
        };

        // ── Preflight OPTIONS ──
        if (req.method === "OPTIONS") {
            return new Response(null, {
                status: 204,
                headers: {
                    "Access-Control-Allow-Origin": origin,
                    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
                    "Access-Control-Allow-Headers": "Content-Type",
                    "Access-Control-Allow-Credentials": "true",
                },
            });
        }

        // ── Auth: Login ──
        if (url.pathname === "/auth/login" && req.method === "POST") {
            try {
                const body = await req.json() as { handle: string };
                console.log("Login attempt for handle:", body.handle);
                const client = await getOAuthClient();
                const authUrl = await client.authorize(body.handle, { scope: "atproto transition:generic" });
                console.log("Auth URL generated:", authUrl.toString());
                return new Response(JSON.stringify({ url: authUrl.toString() }), { headers });
            } catch (err) {
                console.error("Login error:", err);
                return new Response(JSON.stringify({ error: "Failed to start login" }), { status: 500, headers });
            }
        }

        // ── Auth: Callback ──
        if (url.pathname === "/auth/callback" && req.method === "GET") {
            try {
                const client = await getOAuthClient();
                const { session } = await client.callback(url.searchParams);
                const did = session.did;

                console.log("Callback successful, DID:", did);

                return new Response(null, {
                    status: 302,
                    headers: {
                        ...headers,
                        "Location": `http://127.0.0.1:5173/callback?did=${encodeURIComponent(did)}`,
                    },
                });
            } catch (err) {
                console.error("Callback error:", err);
                return new Response(null, {
                    status: 302,
                    headers: { Location: "http://127.0.0.1:5173?error=auth_failed" },
                });
            }
        }

        // ── Auth: Logout ──
        if (url.pathname === "/auth/logout" && req.method === "POST") {
            const cookie = serialize("session", "", {
                httpOnly: true,
                maxAge: 0,
                path: "/",
            });
            return new Response(JSON.stringify({ success: true }), {
                headers: { ...headers, "Set-Cookie": cookie },
            });
        }

        // ── Auth: Me ──
        if (url.pathname === "/auth/me" && req.method === "GET") {
            const agent = await getAgentForRequest(req);
            if (!agent) {
                return new Response(JSON.stringify({ user: null }), { headers });
            }
            return new Response(JSON.stringify({ user: { did: agent.did } }), { headers });
        }

        // ── Auth: Session ──
        if (url.pathname === "/auth/session" && req.method === "POST") {
            try {
                const body = await req.json() as { did: string };
                const client = await getOAuthClient();
                const agent = await client.restore(body.did);

                const cookie = serialize("session", agent.did, {
                    httpOnly: true,
                    secure: false,
                    sameSite: "lax",
                    maxAge: 60 * 60 * 24 * 7,
                    path: "/",
                });

                return new Response(JSON.stringify({ success: true, did: agent.did }), {
                    headers: { ...headers, "Set-Cookie": cookie },
                });
            } catch (err) {
                console.error("Session error:", err);
                return new Response(JSON.stringify({ error: "Session not found" }), { status: 401, headers });
            }
        }

        // ── Feed ──
        if (url.pathname === "/api/feed" && req.method === "GET") {
            const agent = await getAgentForRequest(req);
            if (!agent) {
                return new Response(JSON.stringify({ error: "Not authenticated" }), { status: 401, headers });
            }
            const feed = await agent.app.bsky.feed.getTimeline({ limit: 10 });
            const posts = feed.data.feed.map((item) => {
                const record = item.post.record as { text?: string };
                return {
                    handle: item.post.author.handle,
                    displayName: item.post.author.displayName ?? item.post.author.handle,
                    text: record.text ?? "No text content",
                    likeCount: item.post.likeCount ?? 0,
                    repostCount: item.post.repostCount ?? 0,
                };
            });
            return new Response(JSON.stringify(posts), { headers });
        }

        // ── Profile ──
        if (url.pathname === "/api/profile" && req.method === "GET") {
            const agent = await getAgentForRequest(req);
            if (!agent) {
                return new Response(JSON.stringify({ error: "Not authenticated" }), { status: 401, headers });
            }
            const handle = url.searchParams.get("handle");
            if (!handle) {
                return new Response(JSON.stringify({ error: "Handle is required" }), { status: 400, headers });
            }
            const profile = await agent.app.bsky.actor.getProfile({ actor: handle });
            return new Response(JSON.stringify({
                handle: profile.data.handle,
                displayName: profile.data.displayName ?? "No display name",
                bio: profile.data.description ?? "No bio",
                followers: profile.data.followersCount ?? 0,
                following: profile.data.followsCount ?? 0,
                posts: profile.data.postsCount ?? 0,
            }), { headers });
        }

        // ── Create Post ──
        if (url.pathname === "/api/post" && req.method === "POST") {
            const agent = await getAgentForRequest(req);
            if (!agent) {
                return new Response(JSON.stringify({ error: "Not authenticated" }), { status: 401, headers });
            }
            const body = await req.json() as { text: string };
            if (!body.text) {
                return new Response(JSON.stringify({ error: "Text is required" }), { status: 400, headers });
            }
            const result = await agent.app.bsky.feed.post.create(
                { repo: agent.did },
                {
                    text: body.text,
                    createdAt: new Date().toISOString(),
                }
            );
            return new Response(JSON.stringify({ uri: result.uri, cid: result.cid }), { headers });
        }

        // ── Follow ──
        if (url.pathname === "/api/follow" && req.method === "POST") {
            const agent = await getAgentForRequest(req);
            if (!agent) {
                return new Response(JSON.stringify({ error: "Not authenticated" }), { status: 401, headers });
            }
            const body = await req.json() as { handle: string };
            const profile = await agent.app.bsky.actor.getProfile({ actor: body.handle });
            await agent.app.bsky.graph.follow.create(
                { repo: agent.did },
                {
                    subject: profile.data.did,
                    createdAt: new Date().toISOString(),
                }
            );
            return new Response(JSON.stringify({ success: true }), { headers });
        }

        // ── Unfollow ──
        if (url.pathname === "/api/unfollow" && req.method === "POST") {
            const agent = await getAgentForRequest(req);
            if (!agent) {
                return new Response(JSON.stringify({ error: "Not authenticated" }), { status: 401, headers });
            }
            const body = await req.json() as { handle: string };
            const profile = await agent.app.bsky.actor.getProfile({ actor: body.handle });
            if (!profile.data.viewer?.following) {
                return new Response(JSON.stringify({ error: "You are not following this user" }), { status: 400, headers });
            }
            const followUri = profile.data.viewer.following;
            const rkey = followUri.split("/").pop()!;
            await agent.app.bsky.graph.follow.delete({ repo: agent.did, rkey });
            return new Response(JSON.stringify({ success: true }), { headers });
        }

        return new Response(JSON.stringify({ error: "Not found" }), { status: 404, headers });
    },
});

console.log(`🚀 Server running on http://localhost:${server.port}`);