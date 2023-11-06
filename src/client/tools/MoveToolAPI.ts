import AbstractToolAPI from "client/core/abstract/AbstractToolAPI";

export default class MoveToolAPI extends AbstractToolAPI {
	private readonly highlightColor = Color3.fromRGB(166, 209, 255);

	private handles = [];

	constructor(gameUI: GameUI) {
		super(gameUI);
	}

	public displayGUI(noAnimations?: boolean | undefined): void {
		// NO GUI
	}
	public hideGUI(): void {
		// NO GUI
	}

	public equip(): void {
		super.equip();
	}

	public unequip(): void {
		super.unequip();
	}
}
