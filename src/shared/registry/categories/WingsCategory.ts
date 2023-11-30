import AbstractCategory from "../abstract/AbstractCategory";

export default class WingsCategory extends AbstractCategory {
	constructor() {
		super("wings");
	}

	public getDisplayName(): string {
		return "Wings";
	}
}
