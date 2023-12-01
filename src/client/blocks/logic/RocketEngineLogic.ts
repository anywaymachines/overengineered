import BlockLogic from "client/base/BlockLogic";
import Serializer from "shared/Serializer";
import BlockRegistry from "shared/registry/BlocksRegistry";
import AbstractBlock from "shared/registry/abstract/AbstractBlock";

export default class RocketEngineLogic extends BlockLogic {
	private torque = 0;

	//private torqueAddButton: Enum.KeyCode;

	constructor(block: Model) {
		super(block);

		// const key = this.config && this.config["thrust_add"] ?? BlockRegistry.SMALL_ROCKET_ENIGNE.getConfigDefinitions()
		// this.torqueAddButton = this.config!["thrust_add"] as number);
		// print(this.torqueAddButton);

		this.setup();
		//this.inputHandler.onKeyPressed(Enum.KeyCode.X, () => this.keyPressed(Enum.KeyCode.X));
	}

	protected setup() {
		super.setup();
	}
}
