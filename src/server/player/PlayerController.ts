import { Players } from "@rbxts/services";
import { SharedPlots } from "shared/building/SharedPlots";
import { Component } from "shared/component/Component";

export class PlayerController extends Component {
	readonly plot;

	constructor(readonly player: Player) {
		super();

		this.plot = SharedPlots.getPlotByOwnerID(player.UserId);

		this.event.subscribe(Players.PlayerRemoving, (player) => {
			if (player !== this.player) return;
			this.destroy();
		});
	}

	isOnline() {
		return !this.isDestroyed();
	}
}
