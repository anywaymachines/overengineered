import { StarterGui, UserInputService } from "@rbxts/services";
import GuiController from "./GuiController";
import PlayModeController from "./PlayModeController";

const initializeHideInterfaceController = (playModeController: PlayModeController) => {
	UserInputService.InputBegan.Connect((input) => {
		if (input.UserInputType !== Enum.UserInputType.Keyboard) {
			return;
		}

		const toggle = () => {
			const gui = GuiController.getGameUI();

			gui.Enabled = !gui.Enabled;
			StarterGui.SetCoreGuiEnabled(Enum.CoreGuiType.All, gui.Enabled);
			StarterGui.SetCoreGuiEnabled(Enum.CoreGuiType.Backpack, false);
			UserInputService.MouseIconEnabled = gui.Enabled;
		};

		if (input.IsModifierKeyDown("Shift") && UserInputService.IsKeyDown(Enum.KeyCode.G)) {
			toggle();
		}
	});
};

export default initializeHideInterfaceController;
