import { Lighting } from "@rbxts/services";

let minutes = 0;
let hours = 12;
let seconds = 0;

const minutesPerGameDay = 20;
const minutesPerSecond = 24 / minutesPerGameDay;
const secondsPerMinute = 60;
let curTime = tick();
let prevTime;

while (true as boolean) {
	prevTime = curTime;
	curTime = tick();
	const dt = curTime - prevTime;
	seconds = seconds + secondsPerMinute * dt;
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
