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

```ts title="scripts/generate-llms.txt.ts"
import { allDocuments } from "contentlayer/generated";
import {
	generate,
	LLMS_TXT_OUTPUT_DIR_INPUT,
	type PluginOptions,
} from "@vahor/llms-txt";

const options = {
	outputPath: (path) => {
		if (path === LLMS_TXT_OUTPUT_DIR_INPUT) {
			return "./public/llms.txt";
		}
		// path is "./content/posts/[slug].mdx"
		const slug = path.split("/").slice(3).join("/");
		const withoutExtension = slug.split(".").slice(0, -1).join(".");
		return `./public/${withoutExtension}.md`;
	},
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
			title: "Blog",
			links: allDocuments.map((doc) => ({
				title: doc.title,
				url: `https://vahor.fr/${doc.pageType}/${doc.slug}.md`,
				description: doc.description,
			})),
		},
	],
	content: allDocuments.map((doc) => ({
		path: `./content/${doc._raw.sourceFilePath}`,
	})),
} satisfies PluginOptions;

generate(options);
```

And update your package.json to run this script:
```json title="package.json"
{
	"scripts": {
		"build": "next build && bun generate:llms.txt",
		"generate:llms.txt": "bun ./scripts/generate-llms.txt.ts"
	}
}
```

This will generate a `llms.txt` file in the `public` folder and a `.md` file for each post.

```txt title="public/llms.txt"
# MySuperBlog

> This is a super cool blog

In this blog I will write about stuff

## Blog

- [Rehype D2 Plugin](https://vahor.fr/project/rehype-d2.md): Un plugin Rehype pour convertir des diagrammes D2 en SVG ou PNG.
```

```md title="public/project/rehype-d2.md"
---
title: Rehype D2 Plugin
description: Un plugin Rehype pour convertir des diagrammes D2 en SVG ou PNG.
---

tldr: [https://github.com/Vahor/rehype-d2](https://github.com/Vahor/rehype-d2)

...
```

### Options

- `outputPath`: Function that determines where files will be written.
  - Takes the current MDX file path as argument and returns the output path.
  - Return `null` to ignore a file.
  - Use `LLMS_TXT_OUTPUT_DIR_INPUT` constant for the llms.txt file.

- `fs`: Custom filesystem implementation.
  - Must include `writeFileSync`, `mkdirSync`, and `readFileSync` methods.
  - Defaults to Node's built-in `fs` module if not provided.

- `formatFrontmatter`: Function to filter or transform frontmatter properties before writing to `.md` files.
  - Defaults to an identity function if not provided.

- `content`: Array of content paths to process.
  - Each item should be an object with a `path` property.

- `sections`: Array containing a header and sections for the llms.txt file.
  - First item is the header and contains `{ title: string, description?: string, details?: string }`.
  - Subsequent items are sections with `{ title: string, links: { title: string, url: string, description?: string }[] }`.
  - Structured as `[LLMSTxtHeader, ...LLMSTxtSection[]]`.

- `remarkPlugins`: Array of remark plugins to transform markdown content.
  - See [Unified.js guide](https://unifiedjs.com/learn/guide/) for more information.
  - Optional parameter.

# Who is using this?

- [vahor.fr](https://github.com/Vahor/vahor.fr): my personal website
