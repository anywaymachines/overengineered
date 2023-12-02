import SlotsDatabase from "server/SlotsDatabase";
import Logger from "shared/Logger";
import Remotes from "shared/Remotes";

export default class SaveSlotEvent {
	static initialize(): void {
		Logger.info("Loading Slot event listener...");

		Remotes.Server.GetNamespace("Slots").OnFunction("Save", (player, data) => {
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
