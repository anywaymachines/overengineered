import { Players, RunService } from "@rbxts/services";
import PlayerGameUI from "./gui/PlayerGameUI";
import AliveEventsHandler from "./event/AliveEventsHandler";
import ClientUnitTests from "client/tests/ClientUnitTests";

function initializeGUI() {
	AliveEventsHandler.initialize();
	PlayerGameUI.initialize();
}

function initialize() {
	Players.LocalPlayer.CharacterAdded.Connect((_) => initializeGUI());
	initializeGUI(); // First start
}

initialize();

// Unit tests
wait(5);
if (RunService.IsStudio() === true) {
	ClientUnitTests.runClient();
}
