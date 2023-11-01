import { Players } from "@rbxts/services";
import PlayerGameUI from "./gui/PlayerGameUI";
import AliveEventsHandler from "./event/AliveEventsHandler";

function initialize() {
	Players.LocalPlayer.CharacterAdded.Connect((_) => {
		AliveEventsHandler.initialize();

		PlayerGameUI.initialize();
	});
}

// Start all scripts
initialize();
