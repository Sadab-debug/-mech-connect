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
const flaskDir = join(__dirname, "..", "..", "mistrivai", "backend");

const flask = spawn("python3", ["run.py"], {
  cwd: flaskDir,
  env: { ...process.env, FLASK_PORT: "5001" },
  stdio: "inherit",
});

flask.on("error", (err) => {
  logger.error({ err }, "Failed to start Flask subprocess");
});

process.on("exit", () => {
  flask.kill();
});

app.listen(port, (err) => {
  if (err) {
    logger.error({ err }, "Error listening on port");
    process.exit(1);
  }

  logger.info({ port }, "Server listening");
});
