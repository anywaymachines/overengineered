type ConfigUpdateRequest = {
	readonly configs: readonly {
		readonly block: BlockModel;
		readonly key: string;
		readonly value: string;
	}[];
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
type PaintRequest = ({ readonly blocks: readonly BlockModel[] } | { readonly plot: PlotModel }) & {
	readonly color?: Color3;
	readonly material?: Enum.Material;
};

type PlayerMoveRequest = {
	readonly blocks: readonly BlockModel[] | "all";
	readonly vector: Vector3;
};

type PlayerSaveSlotRequest = {
	readonly index: number;
	readonly name?: string;
	readonly color?: SerializedColor;
	readonly touchControls?: TouchControlInfo;
	readonly save: boolean;
};
