import { spawn } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, "..");

const port = String(process.env.PORT ?? "4173");
const host = String(process.env.HOST ?? "0.0.0.0");

const binName = process.platform === "win32" ? "sirv.cmd" : "sirv";
const sirvBin = path.join(projectRoot, "node_modules", ".bin", binName);

const args = ["build", "--single", "--host", host, "--port", port];

const child = spawn(sirvBin, args, {
  cwd: projectRoot,
  stdio: "inherit",
  env: process.env,
});

child.on("exit", (code) => {
  process.exitCode = code ?? 1;
});
