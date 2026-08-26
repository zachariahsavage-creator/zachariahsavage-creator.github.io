import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

import {
  preferredType,
  prefersMarkdown,
  PRODUCES_HTML_MARKDOWN,
} from "../lib/accept-markdown.mjs";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

function read(rel) {
  return fs.readFileSync(path.join(ROOT, rel), "utf8");
}

function exists(rel) {
  return fs.existsSync(path.join(ROOT, rel));
}

function stripScriptsAndStyles(html) {
  return html
    .replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, " ")
    .replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, " ")
    .replace(/<noscript\b[^>]*>[\s\S]*?<\/noscript>/gi, " ");
}

function visibleText(html) {
  const stripped = stripScriptsAndStyles(html)
    .replace(/<[^>]+>/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&nbsp;/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  return stripped;
}

test("Accept negotiation prefers markdown when q-values say so", () => {
  assert.equal(
    preferredType("text/markdown", PRODUCES_HTML_MARKDOWN),
    "text/markdown"
  );
  assert.equal(
    preferredType("text/html", PRODUCES_HTML_MARKDOWN),
    "text/html"
  );
  assert.equal(
    preferredType("text/markdown, text/html;q=0.9", PRODUCES_HTML_MARKDOWN),
    "text/markdown"
  );
  assert.equal(
    preferredType("text/html, text/markdown;q=0.1", PRODUCES_HTML_MARKDOWN),
    "text/html"
  );
  assert.equal(
    preferredType("application/pdf", PRODUCES_HTML_MARKDOWN),
    null
  );
  assert.equal(prefersMarkdown("text/markdown"), true);
  assert.equal(prefersMarkdown("text/html"), false);
});

test("machine-readable agent files exist", () => {
  for (const rel of [
    "llms.txt",
    "index.md",
    "full-gallery.md",
    "404.md",
    "404.html",
    "robots.txt",
    "sitemap.xml",
    "middleware.js",
    "lib/accept-markdown.mjs",
  ]) {
    assert.equal(exists(rel), true, `missing ${rel}`);
  }
});

test("llms.txt includes when-to-use guidance", () => {
  const body = read("llms.txt");
  assert.match(body, /^# Zach Savage Photography/m);
  assert.match(body, /## When to use this site/i);
  assert.match(body, /concert|live-music|event photography/i);
  assert.match(body, /Artist Set|\$100|Event Coverage|\$250/);
  assert.match(body, /zachariahsavage@gmail\.com/);
});

test("404 markdown recovery points at sitemap and llms.txt", () => {
  const body = read("404.md");
  assert.match(body, /llms\.txt/);
  assert.match(body, /sitemap\.xml/);
  assert.match(body, /index\.md|Home/);
});

test("homepage has brand H1 and 500+ chars without JS", () => {
  const html = read("index.html");
  assert.match(
    html,
    /<h1[^>]*class="[^"]*home-flow-heading[^"]*"[^>]*>\s*Zach Savage Photography\s*<\/h1>/
  );
  assert.doesNotMatch(
    html,
    /<h1[^>]*class="[^"]*gallery-bar__title[^"]*"[^>]*>\s*home\s*<\/h1>/
  );
  const text = visibleText(html);
  assert.ok(
    text.length >= 500,
    `expected >= 500 visible chars, got ${text.length}`
  );
  assert.match(text, /Zach Savage/);
  assert.match(text, /Toronto/);
  assert.match(text, /\$100|\$250|Mod Club|Longboat Hall/);
});

test("middleware negotiates Accept and sets Vary", () => {
  const src = read("middleware.js");
  assert.match(src, /text\/markdown/);
  assert.match(src, /Vary/);
  assert.match(src, /Accept/);
  assert.match(src, /404/);
  assert.match(src, /preferredType|accept-markdown/);
});

test("vercel.json advertises Vary Accept on primary pages", () => {
  const conf = JSON.parse(read("vercel.json"));
  const sources = conf.headers.map((h) => h.source);
  assert.ok(sources.includes("/"));
  assert.ok(sources.includes("/full-gallery.html"));
  const home = conf.headers.find((h) => h.source === "/");
  const vary = home.headers.find((h) => h.key === "Vary");
  assert.ok(vary?.value.includes("Accept"));
});
