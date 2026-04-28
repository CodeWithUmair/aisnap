#!/usr/bin/env node
// bin/cli.js
// bin/cli.js

const path = require("path");
const fs = require("fs");
const { generate, DEFAULT_CONFIG } = require("../src/index.js");

const args = process.argv.slice(2);
const rootDir = process.cwd();

// ─── --init : scaffold config ─────────────────────────────────────────────────
if (args.includes("--init")) {
  const configPath = path.join(rootDir, "ai-ctx.config.json");

  if (fs.existsSync(configPath)) {
    console.log("⚠️  ai-ctx.config.json already exists — skipping.");
    process.exit(0);
  }

  const scaffold = {
    output: "codebase.md",
    titleFromPackageJson: true,
    injectPathComment: true,
    extensions: DEFAULT_CONFIG.extensions,
    extraExtensions: [],
    excludeDirs: DEFAULT_CONFIG.excludeDirs,
    extraExcludeDirs: [],
    excludeFiles: DEFAULT_CONFIG.excludeFiles,
    extraExcludeFiles: [],
    includeFiles: [],
  };

  fs.writeFileSync(configPath, JSON.stringify(scaffold, null, 2), "utf-8");
  console.log(
    "✅ ai-ctx.config.json created — edit it to customize your setup.",
  );
  process.exit(0);
}

// ─── --help ───────────────────────────────────────────────────────────────────
if (args.includes("--help") || args.includes("-h")) {
  console.log(`
  ai-ctx — Dump your codebase into a single AI-ready context file

  Usage:
    npx ai-ctx              Run and generate codebase.md
    npx ai-ctx --init       Scaffold an ai-ctx.config.json in current directory
    npx ai-ctx --help       Show this help

  Configuration (in ai-ctx.config.json OR package.json under "ai-ctx" key):

    output              string    Output filename         (default: "codebase.md")
    titleFromPackageJson bool     Use package.json name as title  (default: true)
    injectPathComment   bool     Inject // path at top of each file (default: true)

    extensions          string[]  Replace default extension list
    extraExtensions     string[]  Add ON TOP of defaults (e.g. [".graphql", ".yaml"])

    excludeDirs         string[]  Replace default excluded dirs
    extraExcludeDirs    string[]  Add ON TOP of defaults (e.g. ["scripts", "mocks"])

    excludeFiles        string[]  Replace default excluded files
    extraExcludeFiles   string[]  Add ON TOP of defaults
    includeFiles        string[]  Force-include specific relative file paths

  Example package.json config:
    "ai-ctx": {
      "output": "context.md",
      "extraExtensions": [".graphql"],
      "extraExcludeDirs": ["e2e", "fixtures"],
      "extraExcludeFiles": [".eslintrc.js"]
    }
  `);
  process.exit(0);
}

// ─── Run ──────────────────────────────────────────────────────────────────────
try {
  console.log("🔍 Scanning codebase...");
  const result = generate(rootDir);
  console.log(`\n✅ ${result.output} generated — ${result.files} files`);
  if (result.injected > 0) {
    console.log(`✏️  Path comment injected into ${result.injected} files`);
  }
} catch (err) {
  console.error("❌ ai-ctx failed:", err.message);
  process.exit(1);
}
