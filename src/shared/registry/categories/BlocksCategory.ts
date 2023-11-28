import AbstractCategory from "../abstract/AbstractCategory";

export default class BlocksCategory extends AbstractCategory {
	constructor() {
		super("blocks");
	}

	public getDisplayName(): string {
		return "Blocks";
	}
}
