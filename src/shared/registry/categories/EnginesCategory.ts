import AbstractCategory from "../abstract/AbstractCategory";

export default class EnginesCategory extends AbstractCategory {
	constructor() {
		super("engines");
	}

	public getDisplayName(): string {
		return "Engines";
	}
}
