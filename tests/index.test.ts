import { beforeEach, describe, expect, mock, test } from "bun:test";
import generateLlmsTxt, {
	LLMS_TXT_OUTPUT_DIR_INPUT,
	type PluginOptions,
} from "../src/index.ts";

const options = {
	outputDir: (path) => `tests/${path}`,
	fs: {
		writeFileSync: mock((path, content) => {
			return content;
		}),
		mkdirSync: mock((path) => {
			return path;
		}),
	},
	sections: [
		{
			title: "Test",
			description: "Test description",
			details: "Test details",
			links: [
				{
					title: "Test link",
					url: "https://test.com",
					description: "Test link description",
				},
			],
		},
		{
			title: "Second test",
			description: "Second test description",
			links: [],
		},
		{
			title: "Third test",
			details: "Third test details",
			links: [
				{
					title: "Third test link",
					url: "https://third.test.com",
				},
			],
		},
	],
	content: [],
} satisfies PluginOptions;

beforeEach(() => {
	options.fs.writeFileSync.mockClear();
	options.fs.mkdirSync.mockClear();
});

describe("generate llms.txt", () => {
	test("should generate llms.txt", () => {
		generateLlmsTxt({ ...options, content: [] });
		expect(options.fs.writeFileSync).toHaveBeenCalledTimes(1);
		expect(options.fs.writeFileSync).toHaveBeenCalledWith(
			"tests/llms.txt",
			expect.stringContaining("# Test"),
		);
		expect(options.fs.writeFileSync.mock.results).toMatchSnapshot();
	});
	test("should skip llms.txt generation", () => {
		generateLlmsTxt({
			...options,
			content: [],
			outputDir: (path) => {
				if (path === LLMS_TXT_OUTPUT_DIR_INPUT) {
					return null;
				}
				return path;
			},
		});
		expect(options.fs.writeFileSync).not.toHaveBeenCalled();
	});
});
