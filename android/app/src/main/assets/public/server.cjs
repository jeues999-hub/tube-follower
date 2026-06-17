"use strict";
var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));

// server.ts
var import_express = __toESM(require("express"), 1);
var import_vite = require("vite");
var import_path = __toESM(require("path"), 1);
var import_fs = __toESM(require("fs"), 1);
var import_https = __toESM(require("https"), 1);
async function startServer() {
  const app = (0, import_express.default)();
  const PORT = 3e3;
  app.use((req, res, next) => {
    res.set("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate");
    res.set("Pragma", "no-cache");
    res.set("Expires", "0");
    res.set("Surrogate-Control", "no-store");
    next();
  });
  app.get("/api/youtube-metadata", async (req, res) => {
    const urlParam = req.query.url;
    if (!urlParam) {
      return res.status(400).json({ error: "Missing URL parameter" });
    }
    try {
      let targetUrl = urlParam.trim();
      if (!targetUrl.startsWith("http")) {
        if (targetUrl.startsWith("@")) {
          targetUrl = `https://www.youtube.com/${targetUrl}`;
        } else if (targetUrl.startsWith("UC")) {
          targetUrl = `https://www.youtube.com/channel/${targetUrl}`;
        } else {
          targetUrl = `https://www.youtube.com/watch?v=${targetUrl}`;
        }
      }
      const { html, finalUrl } = await new Promise((resolve, reject) => {
        const fetchUrl = (currentUrl, redirectsRemaining) => {
          if (redirectsRemaining < 0) {
            return reject(new Error("Too many redirects"));
          }
          import_https.default.get(currentUrl, {
            headers: {
              "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/115.0.0.0 Safari/537.36",
              "Accept-Language": "en-US,en;q=0.9",
              "Cache-Control": "no-cache"
            }
          }, (res2) => {
            if (res2.statusCode && res2.statusCode >= 300 && res2.statusCode < 400 && res2.headers.location) {
              let redirectUrl = res2.headers.location;
              if (!redirectUrl.startsWith("http")) {
                const parsed = new URL(currentUrl);
                redirectUrl = parsed.protocol + "//" + parsed.host + redirectUrl;
              }
              return fetchUrl(redirectUrl, redirectsRemaining - 1);
            }
            let data = "";
            res2.on("data", (chunk) => {
              data += chunk;
            });
            res2.on("end", () => {
              resolve({ html: data, finalUrl: currentUrl });
            });
          }).on("error", (err) => {
            reject(err);
          });
        };
        fetchUrl(targetUrl, 4);
      });
      const titleMatch = html.match(/<meta property="og:title" content="([^"]+)"/) || html.match(/<title>([^<]+)<\/title>/);
      const imageMatch = html.match(/<meta property="og:image" content="([^"]+)"/) || html.match(/<link rel="image_src" href="([^"]+)"/);
      const descMatch = html.match(/<meta property="og:description" content="([^"]+)"/) || html.match(/<meta name="description" content="([^"]+)"/);
      let title = titleMatch ? titleMatch[1] : "";
      let thumbnail = imageMatch ? imageMatch[1] : "";
      let description = descMatch ? descMatch[1] : "";
      const cleanEntities = (str) => {
        return str.replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&apos;/g, "'");
      };
      title = cleanEntities(title);
      description = cleanEntities(description);
      if (title.includes("YouTube") && title.length < 10) {
        title = "YouTube Creator";
      }
      let count = 1e3;
      const subRegexes = [
        /([\d,.]+)\s*(?:M|K|B)?\s*subscribers/i,
        /subscribers:\s*([\d.,MK]+)/i,
        /"subscriberCountText"\s*:\s*\{\s*"simpleText"\s*:\s*"([^"]+)"/i,
        /"subscriberCountText"[^}]+"accessibility"[^}]+"label":"([^"]+)"/i
      ];
      for (const regex of subRegexes) {
        const match = html.match(regex);
        if (match) {
          const matchedText = match[1];
          let cleanText = matchedText.toLowerCase().replace(/subscribers/i, "").trim();
          let multiplier = 1;
          if (cleanText.includes("m") || cleanText.includes("million")) {
            multiplier = 1e6;
            cleanText = cleanText.replace(/million/g, "").replace(/m/g, "").trim();
          } else if (cleanText.includes("k") || cleanText.includes("thousand")) {
            multiplier = 1e3;
            cleanText = cleanText.replace(/thousand/g, "").replace(/k/g, "").trim();
          }
          const parsedVal = parseFloat(cleanText.replace(/,/g, ""));
          if (!isNaN(parsedVal)) {
            count = Math.floor(parsedVal * multiplier);
            break;
          }
        }
      }
      if (count === 1e3) {
        const genericMatch = html.match(/([\d.,]+[MK]?)\s*subscribers/i);
        if (genericMatch) {
          const raw = genericMatch[1].toLowerCase();
          let mult = 1;
          if (raw.includes("m")) {
            mult = 1e6;
          } else if (raw.includes("k")) {
            mult = 1e3;
          }
          const val = parseFloat(raw.replace(/[^0-9.]/g, ""));
          if (!isNaN(val)) {
            count = Math.floor(val * mult);
          }
        }
      }
      const isChannel = targetUrl.includes("/channel/") || targetUrl.includes("/c/") || targetUrl.includes("/user/") || targetUrl.includes("@") || urlParam.startsWith("UC");
      res.json({
        success: true,
        title: title || (isChannel ? "YouTube Channel" : "YouTube Video"),
        channelTitle: title || (isChannel ? "YouTube Channel" : "YouTube Video"),
        thumbnail: thumbnail || (isChannel ? `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(title || "YT")}&backgroundColor=ff0000&color=white` : "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' width='100' height='100' fill='%232196F3'><rect width='24' height='24' rx='4' fill='%23E3F2FD'/><path d='M10 15l5.5-3L10 9v6zM21 6H3c-1.1 0-2 .9-2 2v8c0 1.1.9 2 2 2h18c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2z' fill='%232196F3'/></svg>"),
        count
      });
    } catch (err) {
      console.warn("YouTube metadata route error:", err.message);
      res.json({
        success: false,
        error: err.message,
        title: "YouTube Link",
        channelTitle: "YouTube Link",
        thumbnail: "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' width='100' height='100' fill='%232196F3'><rect width='24' height='24' rx='4' fill='%23E3F2FD'/><path d='M10 15l5.5-3L10 9v6zM21 6H3c-1.1 0-2 .9-2 2v8c0 1.1.9 2 2 2h18c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2z' fill='%232196F3'/></svg>",
        count: 1e3
      });
    }
  });
  if (process.env.NODE_ENV !== "production") {
    const vite = await (0, import_vite.createServer)({
      server: { middlewareMode: true },
      appType: "spa"
    });
    app.use(vite.middlewares);
    app.get("*", async (req, res, next) => {
      try {
        const url = req.originalUrl;
        let template = await import_fs.default.readFileSync(import_path.default.resolve(process.cwd(), "index.html"), "utf-8");
        template = await vite.transformIndexHtml(url, template);
        res.status(200).set({ "Content-Type": "text/html" }).end(template);
      } catch (e) {
        vite.ssrFixStacktrace(e);
        next(e);
      }
    });
  } else {
    const distPath = import_path.default.join(process.cwd(), "dist");
    app.use(import_express.default.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(import_path.default.join(distPath, "index.html"));
    });
  }
  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}
startServer();
//# sourceMappingURL=server.cjs.map
