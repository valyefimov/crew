import { defineConfig } from "tsup";

export default defineConfig({
  entry: { crew: "src/index.ts" },
  format: "esm",
  platform: "node",
  target: "node22",
  clean: true,
  // keep `node:` prefixes — `node:sqlite` has no bare alias
  removeNodeProtocol: false,
  // Workspace packages are bundled in; real deps stay external.
  noExternal: [/^@crew\//],
  banner: { js: "#!/usr/bin/env node" },
});
