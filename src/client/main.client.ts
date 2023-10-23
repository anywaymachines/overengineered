import { Players } from "@rbxts/services";
import SharedLoader from "shared/Loader";
import GuiController from "./gui/GuiController";

// Initializing shared components
SharedLoader.load();

Players.LocalPlayer.CharacterAdded.Connect((character) => {
	GuiController.ininitalize();
});
