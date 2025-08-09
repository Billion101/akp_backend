export default {
async fetch(request) {
if (request.method !== 'POST') {
return new Response(JSON.stringify({ success: false, message: 'Only POST allowed' }), {
status: 405,
headers: { 'Content-Type': 'application/json' },
});
}

    try {
      const body = await request.json();

      // Optional: Validate body has search_no
      if (!body.search_no || typeof body.search_no !== 'string') {
        return new Response(JSON.stringify({ success: false, message: 'Missing or invalid search_no' }), {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        });
      }

      // Forward to original API
      const apiRes = await fetch('http://lsvlo.com/api/searchTracking2', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      });

      const apiText = await apiRes.text(); // in case response is not JSON
      return new Response(apiText, {
        status: apiRes.status,
        headers: {
          'Content-Type': apiRes.headers.get('content-type') || 'application/json',
        },
      });

    } catch (err) {
      return new Response(JSON.stringify({ success: false, message: 'Proxy error', error: err.message }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }

},
};
