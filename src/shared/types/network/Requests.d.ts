type ConfigUpdateRequest = {
	readonly blocks: readonly BlockModel[];
	readonly data: {
		readonly key: string;
		readonly value: string;
	};
};

type UpdateLogicConnectionRequest =
	| {
			readonly operation: "connect";
			readonly outputBlock: BlockModel;
			readonly outputConnection: BlockConnectionName;
			readonly inputBlock: BlockModel;
			readonly inputConnection: BlockConnectionName;
	  }
	| {
			readonly operation: "disconnect";
			readonly inputBlock: BlockModel;
			readonly inputConnection: BlockConnectionName;
	  };

type PlayerDeleteBlockRequest = readonly BlockModel[] | "all";

type PlayerMoveRequest = {
	readonly vector: Vector3;
};

type PlaceBlockRequest = {
	readonly id: string;
	readonly color: Color3;
	readonly material: Enum.Material;
	readonly location: CFrame;
	readonly uuid?: string;
	readonly config?: Readonly<Record<string, string>>;
};

type PlayerSaveSlotRequest = {
	readonly index: number;
	readonly name?: string;
	readonly color?: SerializedColor;
	readonly touchControls?: TouchControlInfo;
	readonly save: boolean;
};
