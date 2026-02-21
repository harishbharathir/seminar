import { build } from "esbuild";
import { fileURLToPath } from "url";
import { dirname, join } from "path";
import fs from "fs";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const root = join(__dirname, "..");

async function runBuild() {
    // Ensure dist directory exists
    if (!fs.existsSync(join(root, "dist"))) {
        fs.mkdirSync(join(root, "dist"));
    }

    // Build the backend
    console.log("Building backend...");
    await build({
        entryPoints: [join(root, "server/index.ts")],
        bundle: true,
        platform: "node",
        format: "esm",
        outfile: join(root, "dist/index.mjs"),
        external: [
            "express",
            "mongodb",
            "mongoose",
            "socket.io",
            "bcryptjs",
            "passport",
            "passport-local",
            "express-session",
            "cors",
            "dotenv"
        ],
        banner: {
            js: 'import { createRequire } from "module"; const require = createRequire(import.meta.url);',
        },
    });
    console.log("Backend build complete: dist/index.mjs");
}

runBuild().catch((err) => {
    console.error("Build failed:", err);
    process.exit(1);
});
