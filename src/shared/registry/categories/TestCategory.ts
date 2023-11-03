import AbstractCategory from "../AbstractCategory";

export default class TestCategory extends AbstractCategory {
	public getImageAssetID(): number {
		return 0;
	}
	constructor() {
		super("test");
	}

	public getDisplayName(): string {
		return "Engines";
	}
}
