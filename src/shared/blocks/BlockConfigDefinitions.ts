import type { BlockConfigType } from "shared/blockLogic/BlockLogic";

export namespace BlockConfigDefinitions {
	export function any(
		displayName: string,
		defaultType: BlockConfigTypes2.TypeKeys,
		group?: string,
		additional?: Partial<BlockConfigType>,
	) {
		return {
			displayName,
			group,
			defaultType,
			types: {
				bool: {
					config: false as boolean,
					default: false as boolean,
				},
				number: {
					default: 0 as number,
					config: 0 as number,
				},
				vector3: {
					default: Vector3.zero,
					config: Vector3.zero,
				},
				string: {
					default: "" as string,
					config: "" as string,
				},
				byte: {
					default: 0 as number,
					config: 0 as number,
				},
			},
			...(additional ?? {}),
		} as const satisfies BlockConfigType;
	}
}
