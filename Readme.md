# aisnap

> Dump your entire codebase into a single AI-ready context file — one command, zero config needed.

Built for developers who work with AI assistants (Claude, ChatGPT, Gemini). Instead of copy-pasting files one by one, run `npx aisnap` and get a perfectly formatted `codebase.md` you can drop straight into any AI chat.

## Usage

```bash
# No install needed — just run in your project root
npx aisnap

# Scaffold a config file (optional)
npx aisnap --init
```

That's it. A `codebase.md` file appears at your project root.

The title is auto-pulled from your `package.json` name field.

---

## Configuration

Zero config required — it works out of the box. But if you need to customize, you have two options:

### Option A — `aisnap.config.json` (recommended)

Run `npx aisnap --init` to scaffold this file, then edit it:

```json
{
  "output": "codebase.md",
  "titleFromPackageJson": true,
  "injectPathComment": true,

  "extensions": [
    ".ts",
    ".tsx",
    ".js",
    ".jsx",
    ".json",
    ".html",
    ".md",
    ".env",
    ".prisma",
    ".sql"
  ],
  "extraExtensions": [".graphql", ".yaml"],

  "excludeDirs": [
    "node_modules",
    "dist",
    "build",
    ".git",
    ".next",
    "coverage",
    ".turbo",
    "out",
    ".cache",
    "generated"
  ],
  "extraExcludeDirs": ["e2e", "fixtures", "mocks"],

  "excludeFiles": [
    "codebase.md",
    "package-lock.json",
    "yarn.lock",
    "pnpm-lock.yaml"
  ],
  "extraExcludeFiles": [".eslintrc.js", "jest.config.ts"],

  "includeFiles": ["docker-compose.yml", "nginx.conf"]
}
```

### Option B — `package.json` key

No extra file needed. Add an `"aisnap"` key to your existing `package.json`:

```json
{
  "name": "my-app",
  "version": "1.0.0",
  "aisnap": {
    "output": "context.md",
    "extraExtensions": [".graphql"],
    "extraExcludeDirs": ["e2e"]
  }
}
```

---

## Config Options

| Key                    | Type     | Default         | Description                                   |
| ---------------------- | -------- | --------------- | --------------------------------------------- |
| `output`               | string   | `"codebase.md"` | Output filename                               |
| `titleFromPackageJson` | bool     | `true`          | Use `package.json` name as the doc title      |
| `injectPathComment`    | bool     | `true`          | Inject `// relative/path` at top of each file |
| `extensions`           | string[] | see defaults    | **Replace** the default extension list        |
| `extraExtensions`      | string[] | `[]`            | **Add** extensions on top of defaults         |
| `excludeDirs`          | string[] | see defaults    | **Replace** default excluded dirs             |
| `extraExcludeDirs`     | string[] | `[]`            | **Add** dirs on top of defaults               |
| `excludeFiles`         | string[] | see defaults    | **Replace** default excluded files            |
| `extraExcludeFiles`    | string[] | `[]`            | **Add** files on top of defaults              |
| `includeFiles`         | string[] | `[]`            | Force-include specific files (relative paths) |

> **`extra*` vs replacing** — Use `extra*` keys when you want to keep the defaults and just add more. Use the base key (`extensions`, `excludeDirs`, etc.) when you want full control and want to replace defaults entirely.

---

## Default Extensions

`.ts` `.tsx` `.js` `.jsx` `.json` `.html` `.md` `.env` `.prisma` `.sql`

## Default Excluded Dirs

`node_modules` `dist` `build` `.git` `.next` `coverage` `.turbo` `out` `.cache` `generated`

---

## CLI Reference

```bash
npx aisnap           # Generate codebase.md
npx aisnap --init    # Scaffold aisnap.config.json
npx aisnap --help    # Show help
```

---

## Why?

Working with AI on large codebases means constantly re-explaining context. `aisnap` solves this — one file, full context, ready to paste.

The output file includes:

- Project name from `package.json`
- Generation timestamp + file count
- Every relevant file in fenced code blocks with syntax highlighting hints
- Path comments injected at the top of each file (so AI knows where each file lives)

---

## Publishing to npm

```bash
npm publish --access public
```

---

## License

MIT
