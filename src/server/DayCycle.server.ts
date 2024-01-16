import { Lighting } from "@rbxts/services";

const dayLength = 30;

const cycleTime = dayLength * 60;
const minutesInADay = 24 * 60;

const startTime = tick() - (Lighting.GetMinutesAfterMidnight() / minutesInADay) * cycleTime;
let endTime = startTime + cycleTime;

const timeRatio = minutesInADay / cycleTime;

while (true as boolean) {
	const currentTime = tick();

	if (currentTime > endTime) {
		endTime += cycleTime;
	}

	Lighting.SetMinutesAfterMidnight((currentTime - startTime) * timeRatio);
	wait(1 / 15);
}
