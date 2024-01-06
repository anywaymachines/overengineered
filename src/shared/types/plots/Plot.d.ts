interface Workspace {
	Plots: Folder;
}

interface PlotData {
	ownerID: number;
	whitelistedPlayerIDs: number[];
	blacklistedPlayerIDs: number[];
}

type PlotModel = Model & {
	___nominal: "plotModel";
	Blocks: PlotBlocks;
};

type PlotBlocks = Model & {
	// using a dummy parameter to force use this function instead of the default one
	GetChildren(undef: undefined): readonly BlockModel[];
};

type BlockModel = Model & {
	___nominal: "blockModel";
};
