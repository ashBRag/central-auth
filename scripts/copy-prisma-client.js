const fs = require("fs");
const path = require("path");

const src = path.join(__dirname, "..", "libs", "prisma", "src", "generated");
const dest = path.join(__dirname, "..", "dist", "libs", "prisma", "src", "generated");

if (!fs.existsSync(src)) {
  console.error(`Prisma client not found at ${src}. Run "pnpm prisma:generate" first.`);
  process.exit(1);
}

fs.rmSync(dest, { recursive: true, force: true });
fs.cpSync(src, dest, { recursive: true });
