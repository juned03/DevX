import express, { type Express } from "express";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { type Server } from "http";
import { nanoid } from "nanoid";

// Handle both ESM and CommonJS environments
// When bundled to CommonJS by esbuild, import.meta.url becomes undefined
// We need to detect the environment and use the appropriate method
const getDirname = () => {
  try {
    // Try ESM approach (development with tsx)
    // Access import.meta.url directly - will throw in CommonJS
    // @ts-ignore - import.meta may not exist in CommonJS
    const metaUrl = import.meta.url;
    if (metaUrl) {
      return path.dirname(fileURLToPath(metaUrl));
    }
  } catch {
    // import.meta is not available, we're in CommonJS
  }
  
  // CommonJS fallback (production bundle)
  // Use the directory of the script being executed
  // process.argv[1] is the path to the script (dist/index.cjs)
  if (process.argv[1]) {
    return path.dirname(process.argv[1]);
  }
  
  // Last resort: use current working directory
  return process.cwd();
};

const __dirname = getDirname();

export function log(message: string, source = "express") {
  const formattedTime = new Date().toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  });

  console.log(`${formattedTime} [${source}] ${message}`);
}

export async function setupVite(app: Express, server: Server) {
  // Dynamically import vite only in development to avoid bundling issues
  const { createServer: createViteServer, createLogger } = await import("vite");
  // Use dynamic import with string concatenation to prevent esbuild from statically analyzing it
  // Try to load vite config, but don't fail if it doesn't exist (shouldn't happen in dev, but be defensive)
  let viteConfig: any = {};
  try {
    const viteConfigPath = "../vite.config";
    viteConfig = await import(viteConfigPath + ".js").catch(() => 
      import(viteConfigPath).catch(() => ({}))
    );
  } catch (error) {
    // If vite config can't be loaded, use empty config (vite will use defaults)
    console.warn("Could not load vite.config, using defaults:", error);
    viteConfig = {};
  }
  const viteLogger = createLogger();
  
  const serverOptions = {
    middlewareMode: true,
    hmr: { server },
    allowedHosts: true as const,
  };

  const vite = await createViteServer({
    ...(viteConfig.default || viteConfig),
    configFile: false,
    customLogger: {
      ...viteLogger,
      error: (msg, options) => {
        viteLogger.error(msg, options);
        process.exit(1);
      },
    },
    server: serverOptions,
    appType: "custom",
  });

  app.use(vite.middlewares);
  app.use(async (req, res, next) => {
    const url = req.originalUrl;

    try {
      const clientTemplate = path.resolve(
        __dirname,
        "..",
        "client",
        "index.html",
      );

      // always reload the index.html file from disk incase it changes
      let template = await fs.promises.readFile(clientTemplate, "utf-8");
      template = template.replace(
        `src="/src/main.tsx"`,
        `src="/src/main.tsx?v=${nanoid()}"`,
      );
      const page = await vite.transformIndexHtml(url, template);
      res.status(200).set({ "Content-Type": "text/html" }).end(page);
    } catch (e) {
      vite.ssrFixStacktrace(e as Error);
      next(e);
    }
  });
}

export function serveStatic(app: Express) {
  const distPath = path.resolve(__dirname, "..", "dist", "public");

  if (!fs.existsSync(distPath)) {
    throw new Error(
      `Could not find the build directory: ${distPath}, make sure to build the client first`,
    );
  }

  app.use(express.static(distPath));

  // fall through to index.html if the file doesn't exist
  app.use((_req, res) => {
    res.sendFile(path.resolve(distPath, "index.html"));
  });
}
