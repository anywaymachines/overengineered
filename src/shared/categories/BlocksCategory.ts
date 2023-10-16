import Category from "shared/abstract/Category";

export default class TestBlock extends Category {
	constructor() {
		super("blocks");
	}

	public getDisplayName(): string {
		return "Blocks";
	}

	public getIcon(): string {
		return "rbxasset://textures/icon-16x16.png"; // TODO: Get icon
	}
}
