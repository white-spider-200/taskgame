function loadEnvFile() {
  try {
    const fs = require("fs");
    const path = require("path");

    const envPath = path.join(__dirname, "web", ".env.production");
    if (!fs.existsSync(envPath)) return {};

    const raw = fs.readFileSync(envPath, "utf8");
    const out = {};
    for (const line of raw.split(/\r?\n/)) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) continue;
      const idx = trimmed.indexOf("=");
      if (idx === -1) continue;
      const key = trimmed.slice(0, idx).trim();
      let value = trimmed.slice(idx + 1).trim();
      if (!key) continue;
      if (
        (value.startsWith('"') && value.endsWith('"')) ||
        (value.startsWith("'") && value.endsWith("'"))
      ) {
        value = value.slice(1, -1);
      }
      out[key] = value;
    }
    return out;
  } catch {
    return {};
  }
}

const fileEnv = loadEnvFile();

module.exports = {
  apps: [
    {
      name: "taskgame-web",
      cwd: __dirname + "/web",
      script: "npm",
      args: "run start",
      interpreter: "none",
      env: {
        ...fileEnv,
        NODE_ENV: "production",
        PORT: "3012",
      },
    },
  ],
};
