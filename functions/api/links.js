const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, PATCH, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
};

export async function onRequest(context) {
    const { request, env } = context;
    const url = new URL(request.url);
    const method = request.method;

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

    if (method === 'PATCH') {
        const body = await request.json();
        const { id, title, url: linkUrl, thumbnail } = body;
        if (!id || !title || !linkUrl) {
            return new Response(JSON.stringify({ error: 'id, title and url are required' }), {
                status: 400,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            });
        }
        const raw = await env.LINKS_KV.get('links');
        const links = raw ? JSON.parse(raw) : [];
        const idx = links.findIndex(l => l.id === id);
        if (idx === -1) {
            return new Response(JSON.stringify({ error: 'Not found' }), {
                status: 404,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            });
        }
        links[idx] = { ...links[idx], title, url: linkUrl, thumbnail: thumbnail || '' };
        await env.LINKS_KV.put('links', JSON.stringify(links));
        return new Response(JSON.stringify(links[idx]), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
    }

    if (method === 'PUT') {
        const body = await request.json();
        if (!Array.isArray(body)) {
            return new Response(JSON.stringify({ error: 'array required' }), {
                status: 400,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            });
        }
        await env.LINKS_KV.put('links', JSON.stringify(body));
        return new Response(JSON.stringify({ ok: true }), {
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
