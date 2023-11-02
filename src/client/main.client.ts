import { Players, RunService } from "@rbxts/services";
import PlayerGameUI from "./gui/PlayerGameUI";
import AliveEventsHandler from "./event/AliveEventsHandler";
import ClientUnitTests from "client/tests/ClientUnitTests";

function initialize() {
	Players.LocalPlayer.CharacterAdded.Connect((_) => {
		AliveEventsHandler.initialize();

		PlayerGameUI.initialize();
	});
}
// TODO: CHANGE SROCHNO
AliveEventsHandler.initialize();

PlayerGameUI.initialize();

// Start all scripts
initialize();

wait(5);

// Unit tests
if (RunService.IsStudio() === true) {
	ClientUnitTests.runClient();
}
