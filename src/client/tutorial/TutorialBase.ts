import { BlockDataRegistry } from "shared/BlockDataRegistry";

export type TutorialStep = {
	readonly nextButtonLocked: boolean;
	readonly text: string;
	readonly blockPlaceActions?: readonly BlockPlaceAction[];
	readonly blockMoveActions?: readonly BlockMoveAction[];
	readonly assemlyMoveActions?: readonly AssemlyMoveAction[];
};

export type BlockPlaceAction = {
	readonly id: keyof typeof BlockDataRegistry;
	readonly pos: CFrame;
};

export type BlockMoveAction = {
	readonly blockAt: Vector3;
	readonly pos2: CFrame;
};

export type AssemlyMoveAction = {
	readonly assemblyAt: Vector3;
	readonly move: Vector3;
};

export type ConfigChangeAction = {
	readonly blockAt: Vector3;
	readonly configName: string;
	readonly newValue: string;
};

export type Tutorial = TutorialStep[];
