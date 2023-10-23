import { Players } from "@rbxts/services";
import SharedLoader from "shared/SharedLoader";
import GuiController from "./gui/GuiController";

// Initializing shared components
SharedLoader.load();

Players.LocalPlayer.CharacterAdded.Connect((_) => {
	GuiController.ininitalize();
});
