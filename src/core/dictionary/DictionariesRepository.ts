import { MorfeuszProcessorType } from "./const.js";
import { FILESYSTEM_PATH_SEPARATOR } from "./const.js";
import { readFile } from "node:fs/promises";
import { join } from "node:path";

export type DictionaryData = {
	name: string;
	processorType: MorfeuszProcessorType;
	buffer: ArrayBuffer;
};

export class DictionariesRepository {
	static dictionarySearchPaths: string[] = [".", "morfeusz2/dict", "/usr/share/morfeusz2/dictionaries"]; // includes system install path

	static getDictionaryFilename(
		name: string,
		processorType: MorfeuszProcessorType
	): string {
		const suffix =
			processorType === MorfeuszProcessorType.ANALYZER ? "-a" : "-s";
		return `${name}${suffix}.dict`;
	}

	static async tryToLoadDictionary(
		name: string,
		processorType: MorfeuszProcessorType
	): Promise<DictionaryData | null> {
		const filename = this.getDictionaryFilename(name, processorType);
		for (const dir of this.dictionarySearchPaths) {
			const filepath = join(dir, filename);
			try {
				const bytes = await readFile(filepath);
				return {
					name,
					processorType,
					buffer: bytes.buffer.slice(
						bytes.byteOffset,
						bytes.byteOffset + bytes.byteLength
					)
				};
			} catch {
				// continue
			}
		}
		return null;
	}
}
