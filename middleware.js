/**
 * Content negotiation for AI agents (Accept: text/markdown) + agent-friendly 404s.
 * @see https://acceptmarkdown.com/
 */
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { next } from "@vercel/functions";
import {
  PRODUCES_HTML_MARKDOWN,
  preferredType,
} from "./lib/accept-markdown.mjs";

export const config = {
  runtime: "nodejs",
  matcher: [
    "/",
    "/index.html",
    "/full-gallery.html",
    "/((?!assets/).*)",
  ],
};

const VARY = "Accept, Accept-Encoding";
const ROOT = process.cwd();

const MD_BY_PATH = {
  "/": "/index.md",
  "/index.html": "/index.md",
  "/full-gallery.html": "/full-gallery.md",
};

const PAGE_PATHS = new Set([
  "/",
  "/index.html",
  "/index.md",
  "/full-gallery.html",
  "/full-gallery.md",
  "/llms.txt",
  "/robots.txt",
  "/sitemap.xml",
  "/404.html",
  "/404.md",
  "/contact.html",
  "/home.html",
  "/profile.html",
  "/favicon.ico",
  "/favicon.png",
  "/apple-touch-icon.png",
]);

function normalizePath(pathname) {
  if (pathname.length > 1 && pathname.endsWith("/")) {
    return pathname.slice(0, -1);
  }
  return pathname || "/";
}

function isPassthrough(pathname) {
  return (
    pathname.startsWith("/assets/") ||
    pathname.startsWith("/.well-known/") ||
    pathname.startsWith("/pitch/")
  );
}

function isDocumentPath(pathname) {
  if (isPassthrough(pathname) || PAGE_PATHS.has(pathname)) return false;
  if (/\.[a-z0-9]{1,8}$/i.test(pathname)) return false;
  return true;
}

function readPublic(relPath) {
  const filePath = join(ROOT, relPath.replace(/^\//, ""));
  try {
    return readFileSync(filePath, "utf8");
  } catch {
    return null;
  }
}

function markdownHeaders(extra = {}) {
  return {
    "Content-Type": "text/markdown; charset=utf-8",
    Vary: VARY,
    "Cache-Control": "public, max-age=300, stale-while-revalidate=86400",
    ...extra,
  };
}

export default function middleware(request) {
  const url = new URL(request.url);
  const pathname = normalizePath(url.pathname);
  const accept = request.headers.get("accept");
  const chosen = preferredType(accept, PRODUCES_HTML_MARKDOWN);

  if (isPassthrough(pathname)) {
    return next();
  }

  // Static machine-readable siblings: ensure Content-Type + Vary, no re-fetch.
  if (
    pathname.endsWith(".md") ||
    pathname === "/llms.txt"
  ) {
    const body = readPublic(pathname);
    if (body != null) {
      return new Response(body, {
        status: 200,
        headers: markdownHeaders({
          Link: `</llms.txt>; rel="describedby"`,
        }),
      });
    }
  }

  if (accept && chosen === null && (PAGE_PATHS.has(pathname) || isDocumentPath(pathname))) {
    return new Response("Not Acceptable\n\nAvailable: text/html, text/markdown\n", {
      status: 406,
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        Vary: VARY,
      },
    });
  }

  if (isDocumentPath(pathname)) {
    if (chosen === "text/markdown") {
      const body =
        readPublic("/404.md") ||
        "# Not Found\n\nThis path does not exist. See [/llms.txt](/llms.txt) and [/sitemap.xml](/sitemap.xml).\n";
      return new Response(body, {
        status: 404,
        headers: markdownHeaders(),
      });
    }
    const html = readPublic("/404.html");
    if (html != null) {
      return new Response(html, {
        status: 404,
        headers: {
          "Content-Type": "text/html; charset=utf-8",
          Vary: VARY,
        },
      });
    }
    return new Response("Not Found", {
      status: 404,
      headers: { "Content-Type": "text/plain; charset=utf-8", Vary: VARY },
    });
  }

  if (chosen === "text/markdown" && MD_BY_PATH[pathname]) {
    const mdPath = MD_BY_PATH[pathname];
    const body = readPublic(mdPath);
    if (body != null) {
      return new Response(body, {
        status: 200,
        headers: markdownHeaders({
          Link: `<${mdPath}>; rel="alternate"; type="text/markdown", </llms.txt>; rel="describedby"`,
        }),
      });
    }
  }

  const response = next({
    headers: { Vary: VARY },
  });

  const mdPath = MD_BY_PATH[pathname];
  if (mdPath) {
    response.headers.set(
      "Link",
      `<${mdPath}>; rel="alternate"; type="text/markdown", </llms.txt>; rel="describedby"`
    );
  }

  return response;
}
