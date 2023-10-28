import { Players } from "@rbxts/services";
import SharedLoader from "shared/SharedLoader";
import PlayerGameUI from "./gui/PlayerGameUI";
import AliveEventsHandler from "./AliveEventsHandler";

function initialize() {
	// Initializing shared components
	SharedLoader.load();

	Players.LocalPlayer.CharacterAdded.Connect((_) => {
		AliveEventsHandler.initialize();

		PlayerGameUI.initialize();
	});
}

// Start all scripts
initialize();
