import express, { type Express, type Request, type Response, type NextFunction } from "express";
import cors from "cors";
import pinoHttp from "pino-http";
import { join, dirname } from "path";
import { fileURLToPath } from "url";
import { existsSync } from "fs";
import router from "./routes";
import { logger } from "./lib/logger";

const FLASK_BASE = "http://127.0.0.1:5001/flask";

const app: Express = express();

app.use(
  pinoHttp({
    logger,
    serializers: {
      req(req) {
        return {
          id: req.id,
          method: req.method,
          url: req.url?.split("?")[0],
        };
      },
      res(res) {
        return {
          statusCode: res.statusCode,
        };
      },
    },
  }),
);
app.use(cors({ origin: true, credentials: true }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use("/api", router);

// Serve built Vite frontend in production
const __dirname = dirname(fileURLToPath(import.meta.url));
const staticDir = join(__dirname, "..", "..", "..", "artifacts", "mistrivai", "dist", "public");
if (existsSync(staticDir)) {
  app.use(express.static(staticDir));
}

app.use("/api", async (req: Request, res: Response, _next: NextFunction) => {
  const flaskUrl = `${FLASK_BASE}${req.url}`;

  const headers: Record<string, string> = {};
  if (req.headers["content-type"]) {
    headers["Content-Type"] = req.headers["content-type"];
  }
  if (req.headers["cookie"]) {
    headers["Cookie"] = req.headers["cookie"];
  }

  try {
    const flaskRes = await fetch(flaskUrl, {
      method: req.method,
      headers,
      body:
        req.method !== "GET" && req.method !== "HEAD"
          ? JSON.stringify(req.body)
          : undefined,
    });

    const setCookies = flaskRes.headers.getSetCookie
      ? flaskRes.headers.getSetCookie()
      : [];
    setCookies.forEach((cookie) => res.append("Set-Cookie", cookie));

    const contentType = flaskRes.headers.get("content-type") ?? "application/json";
    res.status(flaskRes.status).type(contentType);
    res.send(await flaskRes.text());
  } catch {
    res.status(502).json({ error: "Backend unavailable. Please retry in a moment." });
  }
});

// SPA fallback — serve index.html for all non-API routes so React Router works
if (existsSync(staticDir)) {
  app.use((_req: Request, res: Response) => {
    res.sendFile(join(staticDir, "index.html"));
  });
}

export default app;
