import Remotes from "shared/Remotes";

export default class DisconnectBlockLogic {
	static initialize() {
		Remotes.Server.GetNamespace("Blocks")
			.GetNamespace("DisconnectBlock")
			.Get("Disconnect")
			.Connect((player: Player, block: Model) => {
				block.FindFirstChild("Ejector")?.Destroy();
			});
	}
}
