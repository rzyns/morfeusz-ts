// prettier.config.ts, .prettierrc.ts, prettier.config.mts, or .prettierrc.mts

import { type Config } from "prettier";

const config: Config = {
	trailingComma: "none",
	arrowParens: "always",
	tabWidth: 4,
	useTabs: true,
	semi: true,
	singleQuote: false
};

export default config;
