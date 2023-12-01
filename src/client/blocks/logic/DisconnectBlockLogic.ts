import BlockLogic from "client/base/BlockLogic";
import VehicleSeatBlockLogic from "./VehicleSeatBlockLogic";
import Remotes from "shared/Remotes";

export default class DisconnectBlockLogic extends BlockLogic {
	constructor(block: Model) {
		super(block);

		this.setup();
	}

	protected setup() {
		print("setup");
		super.setup();

		this.inputHandler.onKeyDown(Enum.KeyCode.X, () => this.keyPressed(Enum.KeyCode.X));
	}

	private keyPressed(keyCode: Enum.KeyCode) {
		if (!VehicleSeatBlockLogic.occupant.get()) {
			return;
		}

		Remotes.Client.GetNamespace("Blocks")
			.GetNamespace("DisconnectBlock")
			.Get("Disconnect")
			.SendToServer(this.block);
	}
}
