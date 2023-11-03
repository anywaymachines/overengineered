import { Players } from "@rbxts/services";
import PlayerGameUI from "./gui/PlayerGameUI";
import AliveEventsHandler from "./event/AliveEventsHandler";

function initializeGUI() {
	AliveEventsHandler.initialize();
	PlayerGameUI.initialize();
}

function initialize() {
	Players.LocalPlayer.CharacterAdded.Connect((_) => initializeGUI());
	initializeGUI(); // First start
}

initialize();
