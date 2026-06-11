import { spawn } from "child_process";
import { fileURLToPath } from "url";
import { dirname, join } from "path";
import app from "./app";
import { logger } from "./lib/logger";

const rawPort = process.env["PORT"];

if (!rawPort) {
  throw new Error(
    "PORT environment variable is required but was not provided.",
  );
}

const port = Number(rawPort);

if (Number.isNaN(port) || port <= 0) {
  throw new Error(`Invalid PORT value: "${rawPort}"`);
}

const __dirname = dirname(fileURLToPath(import.meta.url));

// In production, spawn Flask as a subprocess.
// In development, Flask is started separately via its own workflow to avoid port conflicts.
if (process.env["NODE_ENV"] !== "development") {
  // __dirname = <workspace>/artifacts/api-server/dist
  // 3 levels up = <workspace>
  const workspaceRoot = join(__dirname, "..", "..", "..");
  const flaskDir = join(workspaceRoot, "artifacts", "mistrivai", "backend");

  // Python is in .pythonlibs inside the workspace
  const pythonExec = join(workspaceRoot, ".pythonlibs", "bin", "python3");
  const sitePackages = join(workspaceRoot, ".pythonlibs", "lib", "python3.11", "site-packages");

  logger.info({ pythonExec, flaskDir }, "Starting Flask subprocess");

  const flask = spawn(pythonExec, ["run.py"], {
    cwd: flaskDir,
    env: {
      ...process.env,
      FLASK_PORT: "5001",
      PYTHONPATH: [sitePackages, process.env["PYTHONPATH"]].filter(Boolean).join(":"),
      PATH: `${join(workspaceRoot, ".pythonlibs", "bin")}:${process.env["PATH"] ?? ""}`,
    },
    stdio: "inherit",
  });

  flask.on("error", (err) => {
    logger.error({ err }, "Failed to start Flask subprocess");
  });

  process.on("exit", () => {
    flask.kill();
  });
} else {
  logger.info("Development mode: Flask subprocess skipped (started via its own workflow)");
}

app.listen(port, (err) => {
  if (err) {
    logger.error({ err }, "Error listening on port");
    process.exit(1);
  }

  logger.info({ port }, "Server listening");
});
