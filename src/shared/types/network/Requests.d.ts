type ConfigUpdateRequest = {
	readonly block: Model;
	readonly data: {
		readonly key: string;
		readonly value: string;
	};
};

type PlayerDeleteBlockRequest = readonly Model[] | "all";

type PlayerMoveRequest = {
	readonly vector: Vector3;
};

type PlaceBlockRequest = {
	readonly block: string;
	readonly color: Color3;
	readonly material: Enum.Material;
	readonly location: CFrame;
};

type PlayerSaveSlotRequest = {
	readonly index: number;
	readonly name?: string;
	readonly color?: SerializedColor;
	readonly touchControls?: TouchControlInfo;
	readonly save: boolean;
};
