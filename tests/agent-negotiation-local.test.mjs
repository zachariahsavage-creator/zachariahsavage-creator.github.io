/**
 * Local stand-in for middleware checks without vercel dev.
 * Exercises Accept negotiation + 404 bodies against files on disk.
 */
import assert from "node:assert/strict";
import { createServer } from "node:http";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

import {
  PRODUCES_HTML_MARKDOWN,
  preferredType,
} from "../lib/accept-markdown.mjs";

const ROOT = join(fileURLToPath(new URL(".", import.meta.url)), "..");

const MD_BY_PATH = {
  "/": "/index.md",
  "/index.html": "/index.md",
  "/full-gallery.html": "/full-gallery.md",
};

function normalizePath(pathname) {
  if (pathname.length > 1 && pathname.endsWith("/")) return pathname.slice(0, -1);
  return pathname || "/";
}

function handle(req, res) {
  const url = new URL(req.url || "/", "http://127.0.0.1");
  const pathname = normalizePath(url.pathname);
  const accept = req.headers.accept;
  const chosen = preferredType(accept, PRODUCES_HTML_MARKDOWN);
  const vary = "Accept, Accept-Encoding";

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
  ]);

  const isDoc =
    !PAGE_PATHS.has(pathname) &&
    !pathname.startsWith("/assets/") &&
    !/\.[a-z0-9]{1,8}$/i.test(pathname);

  if (isDoc) {
    if (chosen === "text/markdown") {
      const body = readFileSync(join(ROOT, "404.md"), "utf8");
      res.writeHead(404, {
        "Content-Type": "text/markdown; charset=utf-8",
        Vary: vary,
      });
      res.end(body);
      return;
    }
    const body = readFileSync(join(ROOT, "404.html"), "utf8");
    res.writeHead(404, { "Content-Type": "text/html; charset=utf-8", Vary: vary });
    res.end(body);
    return;
  }

  if (chosen === "text/markdown" && MD_BY_PATH[pathname]) {
    const mdPath = MD_BY_PATH[pathname];
    const body = readFileSync(join(ROOT, mdPath.slice(1)), "utf8");
    res.writeHead(200, {
      "Content-Type": "text/markdown; charset=utf-8",
      Vary: vary,
    });
    res.end(body);
    return;
  }

  if (pathname.endsWith(".md") || pathname === "/llms.txt") {
    const body = readFileSync(join(ROOT, pathname.slice(1)), "utf8");
    res.writeHead(200, {
      "Content-Type": "text/markdown; charset=utf-8",
      Vary: vary,
    });
    res.end(body);
    return;
  }

  if (pathname === "/" || pathname === "/index.html") {
    const body = readFileSync(join(ROOT, "index.html"), "utf8");
    res.writeHead(200, { "Content-Type": "text/html; charset=utf-8", Vary: vary });
    res.end(body);
    return;
  }

  res.writeHead(404, { "Content-Type": "text/plain", Vary: vary });
  res.end("not found");
}

function withServer(run) {
  return new Promise((resolve, reject) => {
    const server = createServer(handle);
    server.listen(0, "127.0.0.1", async () => {
      const { port } = server.address();
      try {
        await run(port);
        server.close();
        resolve();
      } catch (err) {
        server.close();
        reject(err);
      }
    });
  });
}

test("local negotiation: markdown Accept on /", async () => {
  await withServer(async (port) => {
    const res = await fetch(`http://127.0.0.1:${port}/`, {
      headers: { Accept: "text/markdown" },
    });
    assert.equal(res.status, 200);
    assert.match(res.headers.get("content-type") || "", /text\/markdown/);
    assert.match(res.headers.get("vary") || "", /Accept/i);
    const body = await res.text();
    assert.match(body, /Zach Savage Photography/);
    assert.match(body, /When to use/i);
  });
});

test("local negotiation: missing path returns HTTP 404 markdown", async () => {
  await withServer(async (port) => {
    const res = await fetch(`http://127.0.0.1:${port}/no-such-agent-path`, {
      headers: { Accept: "text/markdown" },
    });
    assert.equal(res.status, 404);
    assert.match(res.headers.get("content-type") || "", /text\/markdown/);
    const body = await res.text();
    assert.match(body, /llms\.txt/);
    assert.match(body, /sitemap\.xml/);
  });
});

test("local negotiation: missing path returns HTTP 404 html", async () => {
  await withServer(async (port) => {
    const res = await fetch(`http://127.0.0.1:${port}/no-such-agent-path`, {
      headers: { Accept: "text/html" },
    });
    assert.equal(res.status, 404);
    assert.match(res.headers.get("content-type") || "", /text\/html/);
    const body = await res.text();
    assert.match(body, /llms\.txt/);
  });
});
