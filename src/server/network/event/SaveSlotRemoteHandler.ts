import SlotsDatabase from "server/SlotsDatabase";
import BaseRemoteHandler from "server/base/BaseRemoteHandler";
import Logger from "shared/Logger";
import Remotes from "shared/Remotes";

export default class SaveSlotRemoteHandler extends BaseRemoteHandler {
	constructor() {
		super("slots => save");

		Remotes.Server.GetNamespace("Slots").OnFunction("Save", (player, data) => this.emit(player, data));
	}

	public emit(player: Player, data: PlayerSaveSlotRequest) {
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
	}
}
