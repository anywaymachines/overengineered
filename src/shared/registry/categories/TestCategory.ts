import AbstractCategory from "../AbstractCategory";

export default class TestCategory extends AbstractCategory {
	constructor() {
		super("test");
	}

	public getDisplayName(): string {
		return "Engines";
	}
}
