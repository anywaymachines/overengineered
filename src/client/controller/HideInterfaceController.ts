import { ReplicatedStorage, StarterGui, UserInputService, Workspace } from "@rbxts/services";
import GuiController from "./GuiController";
import PlayModeController from "./PlayModeController";

const initializeHideInterfaceController = (playModeController: PlayModeController) => {
	UserInputService.InputBegan.Connect((input) => {
		if (input.UserInputType !== Enum.UserInputType.Keyboard) {
			return;
		}

		if (UserInputService.GetFocusedTextBox()) {
			return;
		}

		const toggle = () => {
			const gui = GuiController.getGameUI();

			// Hide core gui (excluding backpack)
			StarterGui.SetCoreGuiEnabled(Enum.CoreGuiType.All, gui.Enabled);
			StarterGui.SetCoreGuiEnabled(Enum.CoreGuiType.Backpack, false);

			// Hide screen gui
			gui.Enabled = !gui.Enabled;

			// Hide mouse cursor
			UserInputService.MouseIconEnabled = gui.Enabled;

			// Plot owner gui hide
			Workspace.Plots.GetChildren().forEach((plot) => {
				const ownerGui = plot.FindFirstChild(ReplicatedStorage.Assets.PlotOwnerGui.Name) as
					| BillboardGui
					| undefined;
				if (ownerGui) {
					ownerGui.Enabled = gui.Enabled;
				}
			});
		};

		if (input.IsModifierKeyDown("Shift") && UserInputService.IsKeyDown(Enum.KeyCode.G)) {
			toggle();
		}
	});
};

export default initializeHideInterfaceController;
