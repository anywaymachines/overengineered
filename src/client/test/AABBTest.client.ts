import { RunService, Workspace } from "@rbxts/services";
import Signal from "@rbxts/signal";
import InputController from "client/controller/InputController";
import BuildingManager from "shared/building/BuildingManager";

const test = false;
if (!test) new Signal().Wait();

const cube = new Instance("Model");
cube.Parent = Workspace;
{
	const part = new Instance("Part");
	part.Parent = cube;
	part.Anchored = true;
}
{
	const part = new Instance("Part");
	part.Parent = cube;
	part.Anchored = true;
	part.Position = new Vector3(75, 4.5, 230);
}
{
	const part = new Instance("Part");
	part.Parent = cube;
	part.Anchored = true;
	part.Position = new Vector3(73, 4.5, 230);
}
cube.PivotTo(new CFrame(new Vector3(73, 4.5, 232)));

const createtr = (name: string) => {
	const part = new Instance("Part");
	part.Name = name;
	part.Parent = Workspace;
	part.Transparency = 0.5;
	part.Anchored = true;

	return part;
};

const aabb = createtr("aabb");
const min = createtr("min");
const max = createtr("max");
min.Color = max.Color = new Color3(1, 0, 0);
min.Size = max.Size = new Vector3(0.3, 0.3, 0.3);

RunService.Heartbeat.Connect((dt) => {
	if (InputController.isShiftPressed()) return;

	cube.PivotTo(
		cube
			.GetPivot()
			.Rotation.mul(CFrame.fromOrientation(dt, 0, (dt * 9999) % 0.2))
			.add(cube.GetPivot().Position),
	);

	const [bbrotation, bbsize] = cube.GetBoundingBox();
	min.PivotTo(new CFrame(bbrotation.mul(bbsize.div(-2))));
	max.PivotTo(new CFrame(bbrotation.mul(bbsize.div(2))));

	const region = BuildingManager.getModelAABB(cube);
	aabb.PivotTo(region.CFrame);
	aabb.Size = region.Size;
});
