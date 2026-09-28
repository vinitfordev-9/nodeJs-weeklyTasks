// Supervisor for the single-container free-tier demo. Fail the container if
// migrations fail or either long-running process exits; forward stop signals.
const { spawn } = require("node:child_process");
const path = require("node:path");

function startCloud(spawnProcess = spawn) {
  const children = new Set();
  let stopping = false;
  let deadline;

  function shutdown(code) {
    if (stopping) return;
    stopping = true;
    process.exitCode = code;
    for (const child of children) child.kill("SIGTERM");
    if (children.size) {
      deadline = setTimeout(() => {
        for (const child of children) child.kill("SIGKILL");
      }, 12000);
      deadline.unref();
    }
  }

  function launch(args, onSuccess) {
    const child = spawnProcess(process.execPath, args, {
      cwd: path.join(__dirname, ".."),
      stdio: "inherit",
      env: process.env,
    });
    children.add(child);
    child.on("error", () => {
      console.error("Cloud child process could not start");
      shutdown(1);
    });
    child.on("close", (code) => {
      children.delete(child);
      if (stopping) {
        if (!children.size) clearTimeout(deadline);
        return;
      }
      if (code === 0 && onSuccess) onSuccess();
      else shutdown(1);
    });
    return child;
  }

  process.once("SIGTERM", () => shutdown(0));
  process.once("SIGINT", () => shutdown(0));
  launch(["node_modules/prisma/build/index.js", "migrate", "deploy"], () => {
    launch(["server.js"]);
    launch(["workers/emailWorker.js"]);
  });
}

if (require.main === module) startCloud();
module.exports = { startCloud };
