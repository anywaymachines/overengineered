import BlockLogic from "client/base/BlockLogic";
import Remotes from "shared/Remotes";

export default class DisconnectBlockLogic extends BlockLogic {
	protected prepare() {
		super.prepare();
		this.inputHandler.onKeyDown(Enum.KeyCode.X, () => this.keyPressed(Enum.KeyCode.X));
	}

	private keyPressed(keyCode: Enum.KeyCode) {
		Remotes.Client.GetNamespace("Blocks")
			.GetNamespace("DisconnectBlock")
			.Get("Disconnect")
			.SendToServer(this.block);
	}
}
