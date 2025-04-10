import { beforeEach, describe, expect, mock, test } from "bun:test";
import fs from "node:fs";
// Test dependencies
import { visit } from "unist-util-visit";
import {
	LLMS_TXT_FILENAME,
	type PluginOptions,
	generate,
} from "../src/index.ts";

const disableLlmsOutputPath = (path: string | null) => {
	if (path === LLMS_TXT_FILENAME) {
		return null;
	}
	return `/out/${path}`;
};

const options = {
	outputPath: (path) => `/out/${path}`,
	fs: {
		writeFileSync: mock((path, content) => {
			return content;
		}),
		mkdirSync: mock((path) => {
			return path;
		}),
		// @ts-expect-error
		readFileSync: mock((path, encoding) => {
			return fs.readFileSync(path, "utf-8");
		}),
	},
	sections: [
		{
			title: "Test",
			description: "Test description",
			details: "Test details",
		},
		{
			title: "Second test",
			links: [
				{
					title: "Test link",
					url: "https://test.com",
					description: "Test link description",
				},
			],
		},
		{
			title: "Third test",
			links: [
				{
					title: "Third test link",
					url: "https://third.test.com",
				},
			],
		},
	],
	content: [
		{
			path: "tests/example-content.mdx",
		},
	],
} satisfies PluginOptions;

beforeEach(() => {
	options.fs.writeFileSync.mockClear();
	options.fs.mkdirSync.mockClear();
});

describe("generate llms.txt", () => {
	test("should generate llms.txt", () => {
		// @ts-expect-error
		generate({ ...options, content: [] });
		expect(options.fs.writeFileSync).toHaveBeenCalledTimes(1);
		expect(options.fs.writeFileSync).toHaveBeenCalledWith(
			"/out/llms.txt",
			expect.stringContaining("# Test"),
		);
		expect(options.fs.writeFileSync.mock.results).toMatchSnapshot();
	});
	test("should skip llms.txt generation", () => {
		// @ts-expect-error
		generate({
			...options,
			content: [],
			outputPath: disableLlmsOutputPath,
		});
		expect(options.fs.writeFileSync).not.toHaveBeenCalled();
	});
});

describe("generate markdown files", () => {
	test("should generate markdown files", () => {
		// @ts-expect-error
		generate({ ...options, outputPath: disableLlmsOutputPath });
		expect(options.fs.writeFileSync).toHaveBeenCalledTimes(1);
		expect(options.fs.writeFileSync.mock.results).toMatchSnapshot();
	});
	test("should generate markdown files with custom frontmatter", () => {
		// @ts-expect-error
		generate({
			...options,
			outputPath: disableLlmsOutputPath,
			formatFrontmatter: (frontmatter) => ({
				title: frontmatter.title,
				description: frontmatter.description,
			}),
		});
		expect(options.fs.writeFileSync).toHaveBeenCalledTimes(1);
		expect(options.fs.writeFileSync).toHaveBeenCalledWith(
			"/out/tests/example-content.mdx",
			expect.stringContaining("# Test"),
		);
		expect(options.fs.writeFileSync.mock.results).toMatchSnapshot();
	});
	test("should skip markdown files generation", () => {
		// @ts-expect-error
		generate({
			...options,
			content: [],
			outputPath: () => null,
		});
		expect(options.fs.writeFileSync).not.toHaveBeenCalled();
	});
	test("should transform using remarkPlugins", () => {
		function remarkAddPrefix() {
			// biome-ignore lint/suspicious/noExplicitAny: don't care
			return (tree: any) => {
				visit(tree, "paragraph", (node) => {
					const text = node.children[0].value;
					if (text === "TRANSFORM_THIS") {
						node.children[0].value = "NICE_TRANSFORMATION";
					}
					return node;
				});
				return tree;
			};
		}

		// @ts-expect-error
		generate({
			...options,
			outputPath: disableLlmsOutputPath,
			remarkPlugins: [remarkAddPrefix],
		});
		expect(options.fs.writeFileSync).toHaveBeenCalledTimes(1);
		expect(options.fs.writeFileSync).toHaveBeenCalledWith(
			"/out/tests/example-content.mdx",
			expect.stringContaining("NICE\\_TRANSFORMATION"),
		);
		expect(options.fs.writeFileSync.mock.results).toMatchSnapshot();
	});
});
