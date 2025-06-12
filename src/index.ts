import path from "node:path";
import remarkParse from "remark-parse";
import remarkStringify from "remark-stringify";
import { type Pluggable, unified } from "unified";
import { parse, stringify } from "yaml";

export const LLMS_TXT_FILENAME = "llms.txt";

export interface LLMSTxtSection {
	title: string;
	links: { title: string; url: string; description?: string }[];
}

export interface LLMSTxtHeader {
	title: string;
	description?: string;
	details?: string;
}

export interface PluginOptions {
	/**
	 * The path where the files will be written.
	 * Function that takes the current mdx file path as argument.
	 * Or `LLMS_TXT_FILENAME` for the llms.txt file.
	 * Return `null` to ignore the file.
	 * */
	outputPath: (path: string) => string | null;

	/**
	 * Custom `fs` implementation.
	 * @default require("fs")
	 */
	fs?: Pick<
		typeof import("fs"),
		"writeFileSync" | "mkdirSync" | "readFileSync"
	>;

	/**
	 * Function to filter frontmatter properties before they are written to the `.md` file.
	 * @default (property) => property
	 */
	formatFrontmatter?: (
		frontmatter: Record<string, unknown>,
	) => Record<string, unknown>;

	content: { path: string }[];

	/**
	 * Will generate sections for the llm.txt file.
	 * Based on this format [https://llmstxt.org/#format](https://llmstxt.org/#format)
	 */
	sections: [LLMSTxtHeader, ...LLMSTxtSection[]];

	/**
	 * Plugins to transform the markdown content.
	 * See [https://unifiedjs.com/learn/guide/](https://unifiedjs.com/learn/guide/)
	 *
	 * Each plugin function is called with the following arguments:
	 * - `frontmatter`: The frontmatter of the current file. (Same input as `formatFrontmatter`)
	 */
	remarkPlugins?: Pluggable[];
}

const FRONTMATTER_REGEX = /^---\s*\n([\s\S]*?)\n---\s*\n/;

function extractFrontmatter(raw: string) {
	const rows = raw.match(FRONTMATTER_REGEX)?.[1] ?? "";
	if (!rows) {
		return {};
	}
	return parse(rows);
}

function removeFrontmatter(raw: string) {
	return raw.replace(FRONTMATTER_REGEX, "");
}

export function generateMarkdownFiles(options: PluginOptions) {
	const {
		outputPath,
		content,
		formatFrontmatter = (p) => p,
		remarkPlugins,
	} = options;
	const fs = getFs(options);

	for (const { path: contentPath } of content) {
		const outputPathResult = outputPath(contentPath);
		if (outputPathResult == null) {
			continue;
		}
		const raw = fs.readFileSync(contentPath, "utf-8");
		const rawFrontmatter = extractFrontmatter(raw);
		const frontmatter = formatFrontmatter(rawFrontmatter);
		let markdown = removeFrontmatter(raw);

		if (remarkPlugins) {
			const pluginsWithFrontmatter = remarkPlugins.map((plugin) => [
				plugin,
				{ frontmatter: rawFrontmatter },
			]);
			const processor = unified()
				.use(remarkParse)
				// @ts-expect-error TODO: fix types
				.use(pluginsWithFrontmatter)
				.use(remarkStringify);
			const result = processor.processSync(markdown);
			markdown = result.toString();
		}

		markdown = `---\n${stringify(frontmatter)}---\n\n${markdown}`;

		const dirname = path.dirname(outputPathResult);
		fs.mkdirSync(dirname, { recursive: true });
		fs.writeFileSync(outputPathResult, markdown);
	}
}

export function generateLlmsTxt(options: PluginOptions) {
	const { outputPath, sections } = options;
	const outputPathResult = outputPath(LLMS_TXT_FILENAME);
	if (outputPathResult == null) {
		return;
	}

	const llmsTxt = sections
		.map((section) => {
			const { title } = section;
			const isSection = "links" in section;
			let markdown = `#${isSection ? "#" : ""} ${title}`;
			if (!isSection) {
				const { description, details } = section;
				if (description) {
					markdown += "\n\n";
					markdown += `> ${description.split("\n").join("\n> ")}`;
				}
				if (details) {
					markdown += "\n\n";
					markdown += details;
				}
			}
			if (isSection) {
				const { links } = section;
				if (links.length > 0) {
					markdown += "\n\n";
					markdown += links
						.map((link) => {
							const { title, url, description } = link;
							let value = `- [${title}](${url})`;
							if (description) {
								value += `: ${description}`;
							}
							return value;
						})
						.join("\n");
				}
			}
			return markdown;
		})
		.join("\n\n")
		.trim();

	const dirname = path.dirname(outputPathResult);
	const fs = getFs(options);
	fs.mkdirSync(dirname, { recursive: true });
	fs.writeFileSync(outputPathResult, llmsTxt);
}

function getFs(options: PluginOptions): NonNullable<PluginOptions["fs"]> {
	return options.fs ?? require("node:fs");
}

export function generate(options: PluginOptions) {
	generateMarkdownFiles(options);
	generateLlmsTxt(options);
}
