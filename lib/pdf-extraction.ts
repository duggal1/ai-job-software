import "server-only";
import { extractTextItems } from "unpdf";
import type { StructuredTextItem as UnPDFTextItem } from "unpdf";

if (typeof (Math as unknown as { sumPrecise?: unknown }).sumPrecise !== "function") {
	(Math as unknown as { sumPrecise: (...n: number[]) => number }).sumPrecise = (...nums: number[]) =>
		nums.reduce((a, b) => a + b, 0);
}

export interface TextBlock {
	str: string;
	x: number;
	y: number;
	width: number;
	height: number;
	fontSize: number;
	fontFamily: string;
	hasEOL: boolean;
}

export interface PageContent {
	blocks: TextBlock[];
}

export interface ExtractedPDF {
	pages: PageContent[];
	numPages: number;
}

function toTextBlock(item: UnPDFTextItem): TextBlock {
	return {
		str: item.str,
		x: item.x,
		y: item.y,
		width: item.width,
		height: item.height,
		fontSize: item.fontSize,
		fontFamily: item.fontFamily,
		hasEOL: item.hasEOL,
	};
}

export async function extractPDF(buffer: Uint8Array): Promise<ExtractedPDF> {
	const result = await extractTextItems(buffer);

	return {
		numPages: result.totalPages,
		pages: result.items.map((pageItems) => ({
			blocks: pageItems.map(toTextBlock),
		})),
	};
}
