import { Workspace } from "@rbxts/services";

// Wind Variables
const windXRange = 2; // Turn this, and the Z range up to generate higher speeds.
const windYRange = 1; // I recommend not turning this up too high
const windZRange = 2; // Turn this, and the X range up to generate higher speeds.
const stormMultiFactor = 5; // How much to multiply wind speeds during storms.
const stormChance = 1; // 1 - 100 range. 10 would be a 10% chance.

while (true as boolean) {
	const smoothTime = math.random(60, 300);
	const stormNum = math.random(1, 100);

	const nonStormMulti = 1;
	const windMultiplier = (stormNum > stormChance && nonStormMulti) || stormMultiFactor;

	let randomWindX = math.random(-windXRange, windXRange);
	let randomWindY = math.random(-windYRange, windYRange);
	let randomWindZ = math.random(-windZRange, windZRange);

	if (randomWindX < windXRange / 2) {
		randomWindX = math.random(-windXRange, windXRange);
	}
	if (randomWindY < windYRange / 2) {
		randomWindY = math.random(-windYRange, windYRange);
	}
	if (randomWindZ < windZRange / 2) {
		randomWindZ = math.random(-windZRange, windZRange);
	}

	const randomWindVector3 = new Vector3(
		randomWindX * windMultiplier,
		randomWindY * (windMultiplier / 3),
		randomWindZ * windMultiplier,
	);

	Workspace.SetAttribute("GlobalWindSmoothTime", smoothTime);
	Workspace.SetAttribute("GlobalWindValue", randomWindVector3);

	task.wait(smoothTime);
}
