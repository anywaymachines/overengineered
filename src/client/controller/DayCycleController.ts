import { Lighting } from "@rbxts/services";
import { HostedService } from "shared/GameHost";
import type { PlayerDataStoragee } from "client/PlayerDataStorage";

@injectable
export class DayCycleController extends HostedService {
	constructor(@inject playerData: PlayerDataStoragee) {
		super();

		Lighting.SetMinutesAfterMidnight(14 * 60);

		const timePerDayCycle = 20 * 60;
		const getMinutesAfterMidnightTime = () => {
			const config = playerData.config.get().dayCycle;
			if (config.automatic) {
				return (((DateTime.now().UnixTimestampMillis / 1000) % timePerDayCycle) / timePerDayCycle) * (60 * 24);
			}

			return config.manual * 60;
		};

		this.event.loop(1 / 4, () => Lighting.SetMinutesAfterMidnight(getMinutesAfterMidnightTime()));
	}
}
