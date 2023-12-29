import { Lighting, Workspace } from "@rbxts/services";

Workspace.ServerClockTime.Value = Lighting.ClockTime;

while (true as boolean) {
	Workspace.ServerClockTime.Value += 0.001;
	Lighting.ClockTime = Workspace.ServerClockTime.Value;
	wait();
}
