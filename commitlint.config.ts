import type { UserConfig } from "@commitlint/types";

export default {
	extends: ["@commitlint/config-conventional"],
	ignores: [(message) => /^\s*chore\(\s*release\s*\)/.test(message)]
} satisfies UserConfig;
