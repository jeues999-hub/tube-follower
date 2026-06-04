import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import fs from "fs";
import { fileURLToPath, URL } from "url";
import https from "https";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Disable caching for verification
  app.use((req, res, next) => {
    res.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    res.set('Pragma', 'no-cache');
    res.set('Expires', '0');
    res.set('Surrogate-Control', 'no-store');
    next();
  });

  // API routes FIRST
  // Fast, real-time YouTube metadata scraper endpoint
  app.get("/api/youtube-metadata", async (req, res) => {
    const urlParam = req.query.url as string;
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

      // Fast redirection-following helper
      const { html, finalUrl } = await new Promise<{ html: string; finalUrl: string }>((resolve, reject) => {
        const fetchUrl = (currentUrl: string, redirectsRemaining: number) => {
          if (redirectsRemaining < 0) {
            return reject(new Error("Too many redirects"));
          }

          https.get(currentUrl, {
            headers: {
              "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/115.0.0.0 Safari/537.36",
              "Accept-Language": "en-US,en;q=0.9",
              "Cache-Control": "no-cache"
            }
          }, (res) => {
            if (res.statusCode && res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
              let redirectUrl = res.headers.location;
              if (!redirectUrl.startsWith("http")) {
                const parsed = new URL(currentUrl);
                redirectUrl = parsed.protocol + "//" + parsed.host + redirectUrl;
              }
              return fetchUrl(redirectUrl, redirectsRemaining - 1);
            }

            let data = "";
            res.on("data", (chunk) => {
              data += chunk;
            });
            res.on("end", () => {
              resolve({ html: data, finalUrl: currentUrl });
            });
          }).on("error", (err) => {
            reject(err);
          });
        };

        fetchUrl(targetUrl, 4);
      });

      // Extract OpenGraph tags
      const titleMatch = html.match(/<meta property="og:title" content="([^"]+)"/) || html.match(/<title>([^<]+)<\/title>/);
      const imageMatch = html.match(/<meta property="og:image" content="([^"]+)"/) || html.match(/<link rel="image_src" href="([^"]+)"/);
      const descMatch = html.match(/<meta property="og:description" content="([^"]+)"/) || html.match(/<meta name="description" content="([^"]+)"/);

      let title = titleMatch ? titleMatch[1] : "";
      let thumbnail = imageMatch ? imageMatch[1] : "";
      let description = descMatch ? descMatch[1] : "";

      // Clean HTML entities from metadata properties
      const cleanEntities = (str: string) => {
        return str
          .replace(/&amp;/g, "&")
          .replace(/&lt;/g, "<")
          .replace(/&gt;/g, ">")
          .replace(/&quot;/g, '"')
          .replace(/&#39;/g, "'")
          .replace(/&apos;/g, "'");
      };

      title = cleanEntities(title);
      description = cleanEntities(description);

      // Handle default fallback name if not resolved
      if (title.includes("YouTube") && title.length < 10) {
        title = "YouTube Creator";
      }

      // Try parsing subscriber count from descriptions or JSON data inside the page
      let count = 1000;
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
            multiplier = 1000000;
            cleanText = cleanText.replace(/million/g, "").replace(/m/g, "").trim();
          } else if (cleanText.includes("k") || cleanText.includes("thousand")) {
            multiplier = 1000;
            cleanText = cleanText.replace(/thousand/g, "").replace(/k/g, "").trim();
          }
          const parsedVal = parseFloat(cleanText.replace(/,/g, ""));
          if (!isNaN(parsedVal)) {
            count = Math.floor(parsedVal * multiplier);
            break;
          }
        }
      }

      // If subscriber count was not extracted, try a generic regex in the body
      if (count === 1000) {
        const genericMatch = html.match(/([\d.,]+[MK]?)\s*subscribers/i);
        if (genericMatch) {
          const raw = genericMatch[1].toLowerCase();
          let mult = 1;
          if (raw.includes("m")) {
            mult = 1000000;
          } else if (raw.includes("k")) {
            mult = 1000;
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
        thumbnail: thumbnail || (isChannel 
          ? `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(title || "YT")}&backgroundColor=ff0000&color=white`
          : "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' width='100' height='100' fill='%232196F3'><rect width='24' height='24' rx='4' fill='%23E3F2FD'/><path d='M10 15l5.5-3L10 9v6zM21 6H3c-1.1 0-2 .9-2 2v8c0 1.1.9 2 2 2h18c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2z' fill='%232196F3'/></svg>"),
        count
      });

    } catch (err: any) {
      console.warn("YouTube metadata route error:", err.message);
      res.json({
        success: false,
        error: err.message,
        title: "YouTube Link",
        channelTitle: "YouTube Link",
        thumbnail: "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' width='100' height='100' fill='%232196F3'><rect width='24' height='24' rx='4' fill='%23E3F2FD'/><path d='M10 15l5.5-3L10 9v6zM21 6H3c-1.1 0-2 .9-2 2v8c0 1.1.9 2 2 2h18c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2z' fill='%232196F3'/></svg>",
        count: 1000
      });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
    
    // Fallback to serve index.html from root if vite doesn't handle it
    app.get('*', async (req, res, next) => {
      try {
        const url = req.originalUrl;
        let template = await fs.readFileSync(path.resolve(__dirname, 'index.html'), 'utf-8');
        template = await vite.transformIndexHtml(url, template);
        res.status(200).set({ 'Content-Type': 'text/html' }).end(template);
      } catch (e) {
        vite.ssrFixStacktrace(e as Error);
        next(e);
      }
    });
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
