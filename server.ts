import { AtpAgent } from "@atproto/api";

const agent = new AtpAgent({
    service: "https://bsky.social",
});

async function initAgent() {
    await agent.login({
        identifier: process.env.BLUESKY_IDENTIFIER!,
        password: process.env.BLUESKY_PASSWORD!,
    });
    console.log("✅ AT Protocol agent connected!");
}

const server = Bun.serve({
    port: 3001,
    async fetch(req) {
        const url = new URL(req.url);

        // CORS headers so the UI can talk to the server
        const headers = {
            "Content-Type": "application/json",
            "Access-Control-Allow-Origin": "*",
        };

        // Feed endpoint
        if (url.pathname === "/api/feed" && req.method === "GET") {
            const feed = await agent.getTimeline({ limit: 10 });
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

        // Profile endpoint
        if (url.pathname === "/api/profile" && req.method === "GET") {
            const handle = url.searchParams.get("handle");
            if (!handle) {
                return new Response(JSON.stringify({ error: "Handle is required" }), {
                    status: 400,
                    headers,
                });
            }
            const profile = await agent.getProfile({ actor: handle });
            return new Response(JSON.stringify({
                handle: profile.data.handle,
                displayName: profile.data.displayName ?? "No display name",
                bio: profile.data.description ?? "No bio",
                followers: profile.data.followersCount ?? 0,
                following: profile.data.followsCount ?? 0,
                posts: profile.data.postsCount ?? 0,
            }), { headers });
        }

        // Post endpoint
        if (url.pathname === "/api/post" && req.method === "POST") {
            const body = await req.json() as { text: string };
            if (!body.text) {
                return new Response(JSON.stringify({ error: "Text is required" }), {
                    status: 400,
                    headers,
                });
            }
            const result = await agent.post({
                text: body.text,
                createdAt: new Date().toISOString(),
            });
            return new Response(JSON.stringify({ uri: result.uri, cid: result.cid }), { headers });
        }

        // Follow endpoint
        if (url.pathname === "/api/follow" && req.method === "POST") {
            const body = await req.json() as { handle: string };
            const profile = await agent.getProfile({ actor: body.handle });
            await agent.follow(profile.data.did);
            return new Response(JSON.stringify({ success: true }), { headers });
        }

        // Unfollow endpoint
        if (url.pathname === "/api/unfollow" && req.method === "POST") {
            const body = await req.json() as { handle: string };
            const profile = await agent.getProfile({ actor: body.handle });
            if (!profile.data.viewer?.following) {
                return new Response(JSON.stringify({ error: "You are not following this user" }), {
                    status: 400,
                    headers,
                });
            }
            await agent.deleteFollow(profile.data.viewer.following);
            return new Response(JSON.stringify({ success: true }), { headers });
        }

        return new Response(JSON.stringify({ error: "Not found" }), {
            status: 404,
            headers,
        });
    },
});

console.log(`🚀 Server running on http://localhost:${server.port}`);
await initAgent();