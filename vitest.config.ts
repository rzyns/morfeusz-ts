import { defineConfig } from "vitest/config";

export default defineConfig({
	test: {
		environment: "node",
		// Use existing directory name
		dir: "test",
		// Fail fast style; can be adjusted later
		bail: 1
	}
});
