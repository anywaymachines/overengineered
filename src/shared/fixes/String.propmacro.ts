import { Objects } from "shared/fixes/objects";
import { utf8_lc_uc, utf8_uc_lc } from "shared/fixes/utf8data";

// function to force hoisting of the macros, because it does not but still tries to use them
// do NOT remove
const _ = () => [StringMacros];

declare global {
	interface String {
		trim(this: string): string;
		fullLower(this: string): string;
		fullUpper(this: string): string;
	}
}
export const StringMacros: PropertyMacros<String> = {
	trim: (str: String): string => {
		return (str as string).gsub("^%s*(.-)%s*$", "%1")[0];
	},
	fullLower: (str: String): string => {
		let ret = "";
		for (const c of str as string) {
			ret += utf8_uc_lc[c as never] ?? c;
		}

		return ret;
	},
	fullUpper: (str: String): string => {
		let ret = "";
		for (const c of str as string) {
			ret += utf8_lc_uc[c as never] ?? c;
		}

		return ret;
	},
};

export namespace Strings {
	export function pretty(value: unknown): string {
		if (typeIs(value, "string")) return value;

		if (typeIs(value, "table")) {
			return `{ ${Objects.entriesArray(value)
				.map((e) => `${e[0]}: ${pretty(e[1])}`)
				.join()} }`;
		}

		return tostring(value);
	}
}
