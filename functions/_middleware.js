
export async function onRequest(context) {
  const password = context.env.PREVIEW_PASSWORD;

  if (!password) {
    return new Response("Preview protection not configured", {
      status: 503
    });
  }

  const header = context.request.headers.get("Authorization") || "";

  let provided = "";

  if (header.startsWith("Basic ")) {
    try {
      const decoded = atob(header.slice(6));
      const separator = decoded.indexOf(":");
      if (separator !== -1) {
        const username = decoded.slice(0, separator);
        if (username === "editor") {
          provided = decoded.slice(separator + 1);
        }
      }
    } catch {
      // Invalid authorization header.
    }
  }

  const encoder = new TextEncoder();

  async function hash(value) {
    const data = encoder.encode(value);
    return new Uint8Array(
      await crypto.subtle.digest("SHA-256", data)
    );
  }

  const expected = await hash(password);
  const actual = await hash(provided);

  let difference = 0;
  for (let i = 0; i < expected.length; i++) {
    difference |= expected[i] ^ actual[i];
  }

  if (difference !== 0 || !provided) {
    return new Response("Authentication required", {
      status: 401,
      headers: {
        "WWW-Authenticate": 'Basic realm="Cursor BG Preview"',
        "Cache-Control": "no-store"
      }
    });
  }

  const response = await context.next();
  const result = new Response(response.body, response);
  result.headers.set("Cache-Control", "private, no-store");
  return result;
}
