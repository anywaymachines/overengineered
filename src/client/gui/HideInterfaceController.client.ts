import { ReplicatedStorage, StarterGui, UserInputService, Workspace } from "@rbxts/services";
import Gui from "./Gui";

let enabled = true;
const guis = [Gui.getGameUI(), Gui.getUnscaledGameUI()];
const toggle = () => {
	enabled = !enabled;

	// hide screen guis
	for (const ui of guis) {
		ui.Enabled = enabled;
	}

	// Hide core gui (excluding backpack)
	StarterGui.SetCoreGuiEnabled(Enum.CoreGuiType.All, enabled);
	StarterGui.SetCoreGuiEnabled(Enum.CoreGuiType.Backpack, false);
	UserInputService.MouseIconEnabled = enabled;

	// Hide mouse cursor
	UserInputService.MouseIconEnabled = enabled;

	// Plot owner gui hide
	Workspace.Plots.GetChildren().forEach((plot) => {
		const ownerGui = plot.FindFirstChild(ReplicatedStorage.Assets.PlotOwnerGui.Name) as BillboardGui | undefined;
		if (ownerGui) {
			ownerGui.Enabled = enabled;
		}
	});
};

UserInputService.InputBegan.Connect((input) => {
	if (input.UserInputType !== Enum.UserInputType.Keyboard) {
		return;
	}

	if (UserInputService.GetFocusedTextBox()) {
		return;
	}

	if (input.IsModifierKeyDown("Shift") && UserInputService.IsKeyDown(Enum.KeyCode.G)) {
		toggle();
	}
});
