import { spawn } from "node:child_process";
import { mkdirSync, existsSync } from "node:fs";
import path from "node:path";
const base = process.env.MYSQL_BASEDIR || "/Applications/XAMPP/xamppfiles";
const dir = path.resolve(".local-mysql");
mkdirSync(dir, { recursive: true });
if (!existsSync(path.join(dir, "mysql")))
  throw new Error("Initialize .local-mysql first; see README.");
const p = spawn(
  path.join(base, "sbin/mysqld"),
  [
    "--no-defaults",
    `--basedir=${base}`,
    `--datadir=${dir}`,
    "--bind-address=127.0.0.1",
    "--port=3310",
    `--socket=${dir}/mysql.sock`,
    `--pid-file=${dir}/mysql.pid`,
    `--log-error=${dir}/mysql.log`,
  ],
  { stdio: "inherit" },
);
process.on("SIGINT", () => p.kill("SIGTERM"));
p.on("exit", (code) => process.exit(code || 0));
