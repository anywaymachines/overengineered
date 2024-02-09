import { Lighting } from "@rbxts/services";
import PlayerDataStorage from "client/PlayerDataStorage";

const timePerDayCycle = 20 * 60;
const getMinutesAfterMidnightTime = () => {
	const config = PlayerDataStorage.config.get().dayCycle;

	if (config.automatic) {
		return ((os.time() % timePerDayCycle) / timePerDayCycle) * (60 * 24);
	}

	return config.manual * 60;
};

while (true as boolean) {
	Lighting.SetMinutesAfterMidnight(getMinutesAfterMidnightTime());
	task.wait(1);
}
