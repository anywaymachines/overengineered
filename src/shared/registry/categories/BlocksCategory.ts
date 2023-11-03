import AbstractCategory from "../AbstractCategory";

export default class BlocksCategory extends AbstractCategory {
	constructor() {
		super("blocks");
	}

	public getDisplayName(): string {
		return "Blocks";
	}

	public getImageAssetID(): number {
		return 15246712629;
	}
}
