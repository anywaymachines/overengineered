import { Lighting } from "@rbxts/services";
import { PlayerDataStorage } from "client/PlayerDataStorage";
import { HostedService } from "shared/GameHost";

@injectable
export class DayCycleController extends HostedService {
	constructor() {
		super();

		Lighting.SetMinutesAfterMidnight(14 * 60);

		const timePerDayCycle = 20 * 60;
		const getMinutesAfterMidnightTime = () => {
			const config = PlayerDataStorage.config.get().dayCycle;

			if (config.automatic) {
				return (((DateTime.now().UnixTimestampMillis / 1000) % timePerDayCycle) / timePerDayCycle) * (60 * 24);
			}

			return config.manual * 60;
		};

		this.event.loop(1 / 4, () => Lighting.SetMinutesAfterMidnight(getMinutesAfterMidnightTime()));
	}
}
