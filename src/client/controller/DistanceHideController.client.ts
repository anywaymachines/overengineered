import { Players, RunService, Workspace } from "@rbxts/services";

const parts: BasePart[] = [
	Workspace.FindFirstChild("Baseplate") as BasePart,
	...Workspace.WaitForChild("Plots")
		.GetChildren()
		.map((p) => p.WaitForChild("BuildingArea") as BasePart),
	...Workspace.WaitForChild("Obstacles")
		.GetChildren()
		.filter((p) => p.IsA("BasePart"))
		.map((p) => p as BasePart),
];

const tr: (BasePart | Decal)[] = [];
for (const part of parts.map((p) => p.GetDescendants() as (BasePart | Decal)[])) {
	for (const p of part) {
		if (p.IsA("BasePart") || p.IsA("Decal")) {
			tr.push(p);
		}
	}
}

const transparencies = new Map([...parts, ...tr].map((p) => [p, p.Transparency]));

RunService.Heartbeat.Connect(() => {
	const maxDistance = 1024;

	for (const part of parts) {
		const distance =
			Players.LocalPlayer.Character?.GetPivot().Position.sub(part.GetPivot().Position).Magnitude ?? 0;

		for (const child of [part, ...part.GetDescendants()]) {
			if (child.IsA("BasePart") || child.IsA("Decal")) {
				child.Transparency = distance > maxDistance ? 1 : transparencies.get(child) ?? 0;
			}
		}
	}
});
