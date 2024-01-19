import { RunService, Workspace } from "@rbxts/services";
import DiscordWebhook from "./DiscordWebhook";

Workspace.AirDensity = 10;
if (Workspace.AirDensity === 10 && !RunService.IsStudio()) {
	DiscordWebhook.important("It looks like FluidForces is now available in roblox");
}
