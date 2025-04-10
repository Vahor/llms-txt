import path from "node:path";
import type * as Local from "contentlayer2/source-files";

interface ContentLayerDocument {
	_raw: Local.RawDocumentData;
}

export const LLMS_TXT_OUTPUT_DIR_INPUT = "llms.txt";

export interface PluginOptions {
	/**
	 * The directory where the llms will be stored.
	 * Function that takes the current mdx file path as argument.
	 * Or `LLMS_TXT_OUTPUT_DIR_INPUT` for the llms.txt file.
	 * Return `null` to ignore the file.
	 * */
	outputDir: (path: string | null) => string | null;

	/**
	 * Custom `fs` implementation.
	 * @default require("fs")
	 */
	fs?: Pick<typeof import("fs"), "writeFileSync" | "mkdirSync">;

	/**
	 * Function to filter frontmatter properties before they are written to the `.md` file.
	 * @default (property) => property
	 */
	formatFrontmatter?: (
		frontmatter: Record<string, unknown>,
	) => Record<string, unknown>;

	content: ContentLayerDocument[];

	/**
	 * Will generate sections for the llm.txt file.
	 * Based on this format [https://github.com/AnswerDotAI/llms-txt#format](https://github.com/AnswerDotAI/llms-txt#format)
	 */
	sections: {
		title: string;
		description?: string;
		details?: string;
		links: { title: string; url: string; description?: string }[];
	}[];
}

function generateMarkdownFiles(options: PluginOptions) {}

function generateLlmsTxt(options: PluginOptions) {
	const { outputDir, sections } = options;
	const outputPath = outputDir(LLMS_TXT_OUTPUT_DIR_INPUT);
	if (outputPath == null) {
		console.debug("Skipping llms.txt generation");
		return;
	}

	const llmsTxt = sections
		.map((section) => {
			const { title, description, details, links } = section;
			let markdown = `# ${title}`;
			if (description) {
				markdown += "\n\n";
				markdown += `> ${description.split("\n").join("\n> ")}`;
			}
			if (details) {
				markdown += "\n\n";
				markdown += details;
			}
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
			return markdown;
		})
		.join("\n\n")
		.trim();

	const dirname = path.dirname(outputPath);
	const fs = getFs(options);
	fs.mkdirSync(dirname, { recursive: true });
	fs.writeFileSync(outputPath, llmsTxt);
}

function getFs(options: PluginOptions) {
	return options.fs ?? require("node:fs");
}

function entryPoint(options: PluginOptions) {
	generateMarkdownFiles(options);
	generateLlmsTxt(options);
}

export default entryPoint;
