// function to force hoisting of the macros, because it does not but still tries to use them
// do NOT remove
const _ = () => [StringMacros];

declare global {
	interface String {
		trim(this: string): string;
	}
}
export const StringMacros: PropertyMacros<String> = {
	trim: (str: String): string => {
		return (str as string).gsub("^%s*(.-)%s*$", "%1")[0];
	},
};
