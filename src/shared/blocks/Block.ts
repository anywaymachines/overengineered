import type { BlockConfigBothDefinitions, GenericBlockLogicCtor } from "shared/blockLogic/BlockLogic";

declare global {
	export type Block = {
		readonly id: string;
		readonly name: string;
		readonly description: string;

		readonly logic: {
			readonly config: BlockConfigBothDefinitions;
			readonly ctor: GenericBlockLogicCtor;
		};
	};
}
