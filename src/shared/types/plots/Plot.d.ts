interface Workspace {
	readonly Plots: Folder;
}

interface PlotData {
	readonly ownerID: number;
	readonly whitelistedPlayerIDs: number[];
	readonly blacklistedPlayerIDs: number[];
}

type PlotModel = Folder & {
	readonly ___nominal: "plotModel";
	readonly Blocks: PlotBlocks;
	//readonly PrimaryPart: BasePart;
	readonly BuildingArea: BasePart;
};

type PlotBlocks = Model & {
	readonly Parent: PlotModel;

	// using a dummy parameter to force use this function instead of the default one
	GetChildren(undef: undefined): readonly BlockModel[];
};

type BlockModel = Model & {
	readonly ___nominal: "blockModel";
};
