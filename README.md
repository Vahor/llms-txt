# llms-txt

[![Code quality](https://github.com/Vahor/rehype-d2/actions/workflows/quality.yml/badge.svg)](https://github.com/Vahor/llms-txt/actions/workflows/quality.yml)
[![npm downloads](https://img.shields.io/npm/dm/%40vahor%2Fllms-txt)](https://www.npmjs.com/package/@vahor/llms-txt)


Generate [llms.txt](https://llmstxt.org/) file and `.md` file for your content.

## Install

```bash
bun add -D @vahor/llms-txt
```

## Usage

Example with [contentlayer](https://github.com/timlrx/contentlayer2) but you can use any other source of data.

```ts title="scripts/generate-llms.txt.js"
import { allDocuments } from "contentlayer/generated";
import { generate, type PluginOptions } from "@vahor/llms-txt";

const options = {
	outputPath: "./out/public",
	formatFrontmatter: (frontmatter) => ({
		title: frontmatter.title,
		description: frontmatter.description,
	}),
	sections: [
		{
			title: "MySuperBlog",
			description: "This is a super cool blog",
			details: "In this blog I will write about stuff",
		},
		{
			title: "Articles",
			links: allDocuments.map((doc) => ({
				title: doc.title,
				url: `/articles/${doc.slug}`,
				description: doc.description,
			})),
		},
	],
	content: allDocuments.map((doc) => ({ path: doc._raw.sourceFilePath }) 
} satisfies PluginOptions;

generate(options);
```

And update your package.json to run this script:
```json title="package.json"
{
  ...
	"scripts": {
        "build": "next build && npm run generate:llms.txt",
		"generate:llms.txt": "node ./scripts/generate-llms.txt.js"
	}
    ...
}
```
