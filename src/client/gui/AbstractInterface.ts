import { Players, UserInputService } from "@rbxts/services";

export default abstract class AbstractInterface {
	private inputCallback: RBXScriptConnection;

	constructor() {
		this.inputCallback = UserInputService.InputBegan.Connect((input, _) => this.onUserInput(input));
		Players.LocalPlayer.CharacterRemoving.Once((_) => this.terminate());
	}

	/** Method-callback from `UserInputService.InputBegan`. Disabled on self-destruct automatically
	 * @param input InputObject
	 */
	public abstract onUserInput(input: InputObject): void;

	/** Method that will be called automatically when Gui self-destructs */
	public terminate() {
		this.inputCallback.Disconnect();
	}
}
