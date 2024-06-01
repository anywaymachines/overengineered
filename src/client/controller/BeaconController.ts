import { Players } from "@rbxts/services";
import { Beacon } from "client/gui/Beacon";
import { ComponentKeyedChildren } from "shared/component/ComponentKeyedChildren";
import { HostedService } from "shared/GameHost";
import type { SharedPlot } from "shared/building/SharedPlot";

@injectable
export class BeaconController extends HostedService {
	constructor(@inject plot: SharedPlot) {
		super();

		this.initializePlotBeacon(plot);
		this.initializePlayerBeacons();
	}

	private initializePlotBeacon(plot: SharedPlot) {
		this.parent(new Beacon(plot.instance.BuildingArea, "Plot", "plot"));
	}

	private initializePlayerBeacons() {
		const playerBeacons = new ComponentKeyedChildren<string, Beacon>(this);

		const createPlayerBeacon = (player: Player) => {
			// spawn() just in case of infinite wait for something
			spawn(() => {
				while (!player.Character) {
					task.wait(0.1);
				}

				const humanoid = player.Character.WaitForChild("Humanoid") as Humanoid;
				while (!humanoid.RootPart) {
					task.wait(0.1);
				}

				playerBeacons.add(player.Name, new Beacon(humanoid.RootPart, player.DisplayName, "players"));
			});
		};

		const initPlayer = (player: Player) => {
			this.event.subscribe(player.CharacterAdded, () => createPlayerBeacon(player));
			this.event.subscribe(player.CharacterRemoving, () => playerBeacons.remove(player.Name));
		};

		Players.PlayerAdded.Connect(initPlayer);
		for (const player of Players.GetPlayers()) {
			if (player === Players.LocalPlayer) continue;

			createPlayerBeacon(player);
			initPlayer(player);
		}
	}
}
