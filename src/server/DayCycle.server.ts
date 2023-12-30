import { Lighting } from "@rbxts/services";

let curTime = tick();
let prevTime;

while (true as boolean) {
	const currentTime = Lighting.TimeOfDay.split(":");

	let hours = tonumber(currentTime[0])!;
	let minutes = tonumber(currentTime[1])!;
	let seconds = tonumber(currentTime[2])!;

	prevTime = curTime;
	curTime = tick();
	const dt = curTime - prevTime;
	seconds = seconds + 60 * dt;
	if (seconds >= 60) {
		seconds = seconds - 60;
		minutes = minutes + 1;
		if (minutes >= 60) {
			minutes = minutes - 60;
			hours = hours + 1;
			if (hours >= 24) {
				hours = 0;
			}
		}
	}

	Lighting.TimeOfDay = hours + ":" + math.floor(minutes) + ":" + math.floor(seconds);
	wait();
}
