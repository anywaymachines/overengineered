import { Players, UserInputService } from "@rbxts/services";
import GuiUtils from "./GuiUtils";

export default abstract class BaseGui {
	private inputCallback: RBXScriptConnection;
	public GameUI: GameUI;

	constructor() {
		this.GameUI = GuiUtils.getPlayerGui().WaitForChild("GameUI") as unknown as GameUI;
		this.inputCallback = UserInputService.InputBegan.Connect((input, _) => this.userInput(input));
		Players.LocalPlayer.CharacterRemoving.Once((_) => this.terminate());
	}

	/** Method-callback from `UserInputService.InputBegan`. Disabled on self-destruct automatically
	 * @param input InputObject
	 */
	public abstract userInput(input: InputObject): void;

	/** Method that will be called automatically when Gui self-destructs */
	public terminate() {
		this.inputCallback.Disconnect();
	}
}
