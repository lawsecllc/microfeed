import { RssResponseBuilder } from "../../edge-src/common/PageUtils";
import FeedPublicRssBuilder   from "../../edge-src/models/FeedPublicRssBuilder";
import { STATUSES }           from "../../common-src/Constants";

/* ---------- GET: unchanged ---------- */
export async function onRequestGet({ request, env }) {
  const rssResponseBuilder = new RssResponseBuilder(env, request, {
    queryKwargs: { status: STATUSES.PUBLISHED },
  });

  return await rssResponseBuilder.getResponse({
    buildXmlFunc: (jsonData) => {
      const urlObj  = new URL(request.url);
      const builder = new FeedPublicRssBuilder(jsonData, urlObj.origin);
      return builder.getRssData();
    },
  });
}

/* ---------- NEW HEAD: now mirrors the real feed headers ---------- */
export async function onRequestHead({ request, env }) {
  /* 1. Build the XML once (same code path as GET) ------------------ */
  const rssResponseBuilder = new RssResponseBuilder(env, request, {
    queryKwargs: { status: STATUSES.PUBLISHED },
  });
  const jsonData = await rssResponseBuilder.getJsonData();          // helper already inside RssResponseBuilder
  const urlObj   = new URL(request.url);
  const builder  = new FeedPublicRssBuilder(jsonData, urlObj.origin);
  const xml      = builder.getRssData();

  /* 2. Craft a HEAD response that **describes** the GET,            */
  /*    but sends **no body** -------------------------------------- */
  return new Response(null, {
    status: 200,
    headers: {
      "Content-Type"  : "application/rss+xml; charset=utf-8",
      "Content-Length": xml.length.toString(),     // optional but nice
      "Cache-Control" : "public, max-age=300",     // keep whatever you use for GET
      // If your GET response sets ETag / Last-Modified, add them too:
      // "ETag": `"${crypto.subtle.digestSync('SHA-1', new TextEncoder().encode(xml)).slice(0,16).toString('hex')}"`,
    },
  });
}
