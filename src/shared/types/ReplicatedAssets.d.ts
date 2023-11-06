interface ReplicatedStorage {
	Assets: {
		Blocks: Folder;
		Axis: Model & {
			X: BasePart;
			Y: BasePart;
			Z: BasePart;
		};
		MoveHandles: BasePart & {
			XHandles: Handles;
			YHandles: Handles;
			ZHandles: Handles;
		};
	};
}
