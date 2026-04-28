// src/index.js
const fs = require("fs");
const path = require("path");

// ─── Defaults ──────────────────────────────────────────────────────────────────

const DEFAULT_CONFIG = {
  output: "codebase.md",
  extensions: [
    ".ts",
    ".tsx",
    ".js",
    ".jsx",
    ".json",
    ".html",
    ".md",
    ".env",
    ".prisma",
    ".sql",
  ],
  excludeDirs: [
    "node_modules",
    "dist",
    "build",
    ".git",
    ".next",
    "coverage",
    ".turbo",
    "out",
    ".cache",
    "generated",
  ],
  excludeFiles: [
    "codebase.md",
    "package-lock.json",
    "yarn.lock",
    "pnpm-lock.yaml",
    "generate-codebase.cjs",
    "generate-codebase.js",
  ],
  includeFiles: [], // force-include specific file paths (relative)
  injectPathComment: true,
  titleFromPackageJson: true,
};

const EXT_LANG = {
  ".ts": "typescript",
  ".tsx": "typescriptreact",
  ".js": "javascript",
  ".jsx": "javascriptreact",
  ".json": "json",
  ".css": "css",
  ".html": "html",
  ".md": "markdown",
  ".prisma": "prisma",
  ".sql": "sql",
  ".env": "dotenv",
};

const NO_COMMENT_EXTS = new Set([".json", ".md", ".sql", ".html", ".env"]);

// ─── Config Loader ────────────────────────────────────────────────────────────

function loadConfig(rootDir) {
  // 1. Try ai-ctx.config.json at root
  const configFilePath = path.join(rootDir, "ai-ctx.config.json");
  if (fs.existsSync(configFilePath)) {
    try {
      const raw = JSON.parse(fs.readFileSync(configFilePath, "utf-8"));
      return mergeConfig(DEFAULT_CONFIG, raw);
    } catch {
      console.warn("⚠️  Failed to parse ai-ctx.config.json — using defaults");
    }
  }

  // 2. Try "ai-ctx" key in package.json
  const pkgPath = path.join(rootDir, "package.json");
  if (fs.existsSync(pkgPath)) {
    try {
      const pkg = JSON.parse(fs.readFileSync(pkgPath, "utf-8"));
      if (pkg["ai-ctx"]) {
        return mergeConfig(DEFAULT_CONFIG, pkg["ai-ctx"]);
      }
    } catch {
      console.warn("⚠️  Failed to parse package.json — using defaults");
    }
  }

  return { ...DEFAULT_CONFIG };
}

function mergeConfig(defaults, override) {
  const merged = { ...defaults };

  if (override.output) merged.output = override.output;
  if (typeof override.injectPathComment === "boolean")
    merged.injectPathComment = override.injectPathComment;
  if (typeof override.titleFromPackageJson === "boolean")
    merged.titleFromPackageJson = override.titleFromPackageJson;

  // Arrays: if provided, REPLACE defaults (not merge) — gives full control
  if (Array.isArray(override.extensions))
    merged.extensions = override.extensions;
  if (Array.isArray(override.excludeDirs))
    merged.excludeDirs = override.excludeDirs;
  if (Array.isArray(override.excludeFiles))
    merged.excludeFiles = override.excludeFiles;
  if (Array.isArray(override.includeFiles))
    merged.includeFiles = override.includeFiles;

  // Extra arrays — additive on top of defaults
  if (Array.isArray(override.extraExtensions))
    merged.extensions = [
      ...new Set([...merged.extensions, ...override.extraExtensions]),
    ];
  if (Array.isArray(override.extraExcludeDirs))
    merged.excludeDirs = [
      ...new Set([...merged.excludeDirs, ...override.extraExcludeDirs]),
    ];
  if (Array.isArray(override.extraExcludeFiles))
    merged.excludeFiles = [
      ...new Set([...merged.excludeFiles, ...override.extraExcludeFiles]),
    ];

  return merged;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getProjectName(rootDir) {
  const pkgPath = path.join(rootDir, "package.json");
  if (fs.existsSync(pkgPath)) {
    try {
      const pkg = JSON.parse(fs.readFileSync(pkgPath, "utf-8"));
      return pkg.name || null;
    } catch {}
  }
  return null;
}

function getLanguage(filePath) {
  const base = path.basename(filePath);
  if (EXT_LANG[base]) return EXT_LANG[base];
  const ext = path.extname(filePath);
  return EXT_LANG[ext] || "text";
}

function shouldInjectComment(filePath, config) {
  if (!config.injectPathComment) return false;
  const base = path.basename(filePath);
  if (base === ".env" || base.startsWith(".env.")) return false;
  const ext = path.extname(filePath);
  return !NO_COMMENT_EXTS.has(ext);
}

function injectPathComment(filePath, content, relativePath) {
  const comment = `// ${relativePath}`;
  const firstLine = content.split("\n")[0];

  // Already has a path comment — replace it
  if (/^\/\/ \S+\.\w+/.test(firstLine.trim())) {
    return comment + "\n" + content.slice(firstLine.length + 1);
  }

  // Shebang at top
  if (content.startsWith("#!")) {
    const idx = content.indexOf("\n");
    return content.slice(0, idx + 1) + comment + "\n" + content.slice(idx + 1);
  }

  return comment + "\n" + content;
}

function collectFiles(dir, rootDir, config, results = []) {
  const excludeDirsSet = new Set(config.excludeDirs);
  const excludeFilesSet = new Set([...config.excludeFiles, config.output]);

  const entries = fs.readdirSync(dir, { withFileTypes: true });

  for (const entry of entries) {
    const isHidden = entry.name.startsWith(".");
    const isEnvFile = entry.name === ".env" || entry.name.startsWith(".env.");

    if (isHidden && !isEnvFile) continue;
    if (excludeDirsSet.has(entry.name)) continue;
    if (excludeFilesSet.has(entry.name)) continue;

    const fullPath = path.join(dir, entry.name);

    if (entry.isDirectory()) {
      collectFiles(fullPath, rootDir, config, results);
    } else if (entry.isFile()) {
      const ext = path.extname(entry.name);
      if (config.extensions.includes(ext) || isEnvFile) {
        results.push(fullPath);
      }
    }
  }

  return results;
}

// ─── Main Generator ───────────────────────────────────────────────────────────

function generate(rootDir = process.cwd()) {
  const config = loadConfig(rootDir);

  // Collect files
  let files = collectFiles(rootDir, rootDir, config);

  // Force-include extra files
  if (config.includeFiles.length > 0) {
    for (const rel of config.includeFiles) {
      const abs = path.join(rootDir, rel);
      if (fs.existsSync(abs) && !files.includes(abs)) {
        files.push(abs);
      }
    }
  }

  files.sort();

  const projectName = config.titleFromPackageJson
    ? getProjectName(rootDir)
    : null;
  const title = projectName
    ? `# ${projectName} — Full Codebase (AI Context)`
    : "# Full Codebase (AI Context)";

  const lines = [];
  lines.push(`${title}\n`);
  lines.push(`> Generated: ${new Date().toISOString()}`);
  lines.push(`> Total files: ${files.length}\n`);

  let injectedCount = 0;
  const skippedInject = [];

  for (const filePath of files) {
    const relativePath = filePath
      .replace(rootDir + path.sep, "")
      .replace(/\\/g, "/");
    let content = fs.readFileSync(filePath, "utf-8");
    const lang = getLanguage(filePath);

    if (shouldInjectComment(filePath, config)) {
      const updated = injectPathComment(filePath, content, relativePath);
      if (updated !== content) {
        fs.writeFileSync(filePath, updated, "utf-8");
        content = updated;
        injectedCount++;
      }
    } else {
      skippedInject.push(relativePath);
    }

    lines.push(`## ${relativePath}\n`);
    lines.push("```" + lang);
    lines.push(content.trimEnd());
    lines.push("```\n");
  }

  const outputPath = path.join(rootDir, config.output);
  fs.writeFileSync(outputPath, lines.join("\n"), "utf-8");

  return {
    files: files.length,
    injected: injectedCount,
    output: config.output,
  };
}

module.exports = { generate, loadConfig, DEFAULT_CONFIG };
