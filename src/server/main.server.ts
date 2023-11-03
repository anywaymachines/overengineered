import ServerPlots from "./building/ServerPlots";
import BuildEvent from "./building/BuilldEvent";
import DeleteEvent from "./building/DeleteEvent";
import { Players } from "@rbxts/services";

// Plots
ServerPlots.initialize();

// Initializing client-side components
BuildEvent.initialize();
DeleteEvent.initialize();

// Testing whitelist
Players.PlayerAdded.Connect((plr) => {
	if (plr.IsInGroup(1088368) && plr.GetRankInGroup(1088368) < 2) {
		return;
	}

	plr.Kick("Closed testing");
});
