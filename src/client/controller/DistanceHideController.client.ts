import { Players, Workspace } from "@rbxts/services";
import Logger from "shared/Logger";
import RobloxUnit from "shared/RobloxUnit";

// wait for everything to spawn
task.wait(1);

const parts: Instance[] = [
	Workspace.WaitForChild("Baseplate"),
	Workspace.WaitForChild("Plots"),
	Workspace.WaitForChild("Obstacles"),
];

const transparencies = new Map<Instance & { Transparency: number }, number>();
for (const part of parts.map((p) => [p, ...p.GetDescendants()])) {
	for (const p of part) {
		if (p.IsA("BasePart") || p.IsA("Decal") || p.IsA("Texture")) {
			transparencies.set(p, p.Transparency);
		}
	}
}

Logger.info(`[DHC] Initializing ${transparencies.size()} instances`);
const debug = false;
const maxDistance = RobloxUnit.Meters_To_Studs(1024);
let visible = true;

while (true as boolean) {
	task.wait(1);

	const newVisible = (Players.LocalPlayer.Character?.GetPivot().Position.Magnitude ?? 0) < maxDistance;
	if (visible === newVisible) continue;

	visible = newVisible;
	if (debug) Logger.info(`[DHC] ${visible ? "visible" : "non visible"}`);

	for (const [part, transparency] of transparencies) {
		part.Transparency = visible ? transparency ?? 0 : 1;
	}
}
