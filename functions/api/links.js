export async function onRequest(context) {
    const { request, env } = context;
    const url = new URL(request.url);
    const method = request.method;

    const corsHeaders = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
    };

    if (method === 'OPTIONS') {
        return new Response(null, { headers: corsHeaders });
    }

    if (method === 'GET') {
        const raw = await env.LINKS_KV.get('links');
        const links = raw ? JSON.parse(raw) : [];
        return new Response(JSON.stringify(links), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
    }

    // Auth required for mutations
    const key = url.searchParams.get('key');
    if (!key || key !== env.ADMIN_KEY) {
        return new Response(JSON.stringify({ error: 'Unauthorized' }), {
            status: 401,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
    }

    if (method === 'POST') {
        const body = await request.json();
        const { title, url: linkUrl, thumbnail } = body;
        if (!title || !linkUrl) {
            return new Response(JSON.stringify({ error: 'title and url are required' }), {
                status: 400,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            });
        }
        const raw = await env.LINKS_KV.get('links');
        const links = raw ? JSON.parse(raw) : [];
        const newLink = {
            id: crypto.randomUUID(),
            title,
            url: linkUrl,
            thumbnail: thumbnail || '',
            createdAt: new Date().toISOString(),
        };
        links.unshift(newLink);
        await env.LINKS_KV.put('links', JSON.stringify(links));
        return new Response(JSON.stringify(newLink), {
            status: 201,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
    }

    if (method === 'DELETE') {
        const id = url.searchParams.get('id');
        if (!id) {
            return new Response(JSON.stringify({ error: 'id is required' }), {
                status: 400,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            });
        }
        const raw = await env.LINKS_KV.get('links');
        const links = raw ? JSON.parse(raw) : [];
        const filtered = links.filter(l => l.id !== id);
        await env.LINKS_KV.put('links', JSON.stringify(filtered));
        return new Response(JSON.stringify({ ok: true }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
    }

    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
        status: 405,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
}
