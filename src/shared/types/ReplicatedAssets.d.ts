interface ReplicatedStorage {
	Assets: {
		Blocks: Folder;
		Axis: Model & {
			X: BasePart;
			Y: BasePart;
			Z: BasePart;
		};
		MoveHandles: MoveHandles;
	};
}

type MoveHandles = Part & {
	XHandles: Handles;
	YHandles: Handles;
	ZHandles: Handles;
	SelectionBox: SelectionBox;
};
