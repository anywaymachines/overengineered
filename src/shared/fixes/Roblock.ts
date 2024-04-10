import { $defineCallMacros } from "rbxts-transformer-macros";

declare global {
	interface UDim2 {
		with(xscale?: number, xoffset?: number, yscale?: number, yoffset?: number): UDim2;
	}
}

type udim2 = {
	readonly [k in keyof UDim2]?: (udim: UDim2, ...args: Parameters<UDim2[k]>) => ReturnType<UDim2[k]>;
};
export const UDim2Macros = $defineCallMacros<UDim2>({
	with: (udim: UDim2, xscale?: number, xoffset?: number, yscale?: number, yoffset?: number): UDim2 => {
		return new UDim2(
			xscale ?? udim.X.Scale,
			xoffset ?? udim.X.Offset,
			yscale ?? udim.Y.Scale,
			yoffset ?? udim.Y.Offset,
		);
	},
} satisfies udim2);
