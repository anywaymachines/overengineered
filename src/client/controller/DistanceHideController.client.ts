import { Players, Workspace } from "@rbxts/services";
import { GameLoader } from "client/GameLoader";
import { RobloxUnit } from "shared/RobloxUnit";
import { GameDefinitions } from "shared/data/GameDefinitions";

GameLoader.waitForEverything();
const parts: Instance[] = [Workspace.WaitForChild("Plots"), Workspace.WaitForChild("Obstacles")];

const transparencies = new Map<Instance & { Transparency: number }, number>();
for (const part of parts.map((p) => [p, ...p.GetDescendants()])) {
	for (const p of part) {
		if (p.IsA("BasePart") || p.IsA("Decal") || p.IsA("Texture")) {
			transparencies.set(p, p.Transparency);
		}
	}
}

const maxDistance = RobloxUnit.Meters_To_Studs(1024);
let visible = true;

while (true as boolean) {
	task.wait(1);

	const newVisible =
		(new Vector3(0, GameDefinitions.HEIGHT_OFFSET, 0).sub(
			Players.LocalPlayer.Character?.GetPivot().Position ?? Vector3.zero,
		).Magnitude ?? 0) < maxDistance;
	if (visible === newVisible) continue;

	visible = newVisible;

	for (const [part, transparency] of transparencies) {
		part.Transparency = visible ? transparency ?? 0 : 1;
	}
}
