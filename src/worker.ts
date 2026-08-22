// @ts-nocheck
/// <reference types="@cloudflare/workers-types" />

export interface Env {
  MEDIA_BUCKET: R2Bucket;
  UPLOAD_WORKER_SECRET: string;
}

export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    const url = new URL(request.url);

    // Handle CORS preflight requests
    if (request.method === "OPTIONS") {
      return new Response(null, {
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Methods": "GET, PUT, POST, OPTIONS",
          "Access-Control-Allow-Headers": "Content-Type, Authorization",
        },
      });
    }

    // CORS headers for all responses
    const corsHeaders = {
      "Access-Control-Allow-Origin": "*",
    };

    try {
      if (request.method === "PUT") {
        // Authorization Check
        const authHeader = request.headers.get("Authorization");
        if (env.UPLOAD_WORKER_SECRET && authHeader !== `Bearer ${env.UPLOAD_WORKER_SECRET}`) {
          return new Response("Unauthorized", { status: 401, headers: corsHeaders });
        }

        const key = url.pathname.slice(1);
        if (!key) {
          return new Response("Missing object key in URL", { status: 400, headers: corsHeaders });
        }

        await env.MEDIA_BUCKET.put(key, request.body, {
          httpMetadata: request.headers.get("Content-Type") 
            ? { contentType: request.headers.get("Content-Type") as string } 
            : undefined,
        });

        return new Response(`Put ${key} successfully!`, { status: 200, headers: corsHeaders });
      }

      if (request.method === "GET") {
        const key = url.pathname.slice(1);
        if (!key) {
          return new Response("Missing object key in URL", { status: 400, headers: corsHeaders });
        }

        const object = await env.MEDIA_BUCKET.get(key);

        if (object === null) {
          return new Response("Object Not Found", { status: 404, headers: corsHeaders });
        }

        const headers = new Headers(corsHeaders);
        object.writeHttpMetadata(headers);
        headers.set("etag", object.httpEtag);

        return new Response(object.body as unknown as ReadableStream, {
          headers,
        });
      }

      return new Response("Method Not Allowed", {
        status: 405,
        headers: corsHeaders,
      });
    } catch (error: any) {
      return new Response(JSON.stringify({ error: error.message }), { 
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders }
      });
    }
  },
};

