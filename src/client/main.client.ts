import { Players } from "@rbxts/services";
import PlayerGameUI from "./gui/PlayerGameUI";
import RideMode from "./RideMode";

function initializeGUI() {
	PlayerGameUI.initialize();
}

function initialize() {
	Players.LocalPlayer.CharacterAdded.Connect((_) => initializeGUI());
	initializeGUI(); // First start

	RideMode.initialize();
}

initialize();
