import SlotsDatabase from "server/SlotsDatabase";
import Logger from "shared/Logger";
import { registerOnRemoteFunction } from "./RemoteHandler";

export default class SaveSlotRemoteHandler {
	static init() {
		registerOnRemoteFunction("Slots", "Save", (player, data) => {
			Logger.info(`Saving ${player.Name}'s slot ${data.index}`);

			const output = SlotsDatabase.instance.update(
				player.UserId,
				data.index,
				(meta) =>
					meta.set(data.index, {
						...meta.get(data.index),
						name: data.name,
						color: data.color,
					}),
				data.save,
			);

			return {
				...output,
				success: true,
			};
		});
	}
}
