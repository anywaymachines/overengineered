import { Workspace } from "@rbxts/services";
import { LocalPlayer } from "client/controller/LocalPlayer";
import { Beacon } from "client/gui/Beacon";
import { Component } from "shared/component/Component";
import { ComponentKeyedChildren } from "shared/component/ComponentKeyedChildren";
import { HostedService } from "shared/GameHost";
import { PlayerWatcher } from "shared/PlayerWatcher";
import type { PlayerDataStorage } from "client/PlayerDataStorage";
import type { ReadonlyPlot } from "shared/building/ReadonlyPlot";

@injectable
export class BeaconController extends HostedService {
	constructor(@inject plot: ReadonlyPlot, @inject playerData: PlayerDataStorage) {
		super();

		const plotBeacon = this.initializePlotBeacon(plot);
		const playerBeacons = this.initializePlayerBeacons();

		this.event.subscribeObservable(
			playerData.config.createBased((c) => c.beacons),
			(beacons) => plotBeacon.setEnabled(beacons.plot),
			true,
		);

		this.event.subscribeObservable(
			playerData.config.createBased((c) => c.beacons),
			(beacons) => playerBeacons.setEnabled(beacons.players),
			true,
		);
	}

	private initializePlotBeacon(plot: ReadonlyPlot): Beacon {
		const part = new Instance("Part");
		part.Name = "LocalPlotBeacon";
		part.Anchored = true;
		part.Transparency = 1;
		part.CanQuery = part.CanTouch = part.CanCollide = false;
		part.PivotTo(plot.origin);
		part.Parent = Workspace;

		return this.parent(new Beacon(part, "Plot"));
	}

	private initializePlayerBeacons(): Component {
		const component = new Component();
		const playerBeacons = new ComponentKeyedChildren<number, Beacon>(component);

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

				playerBeacons.add(player.UserId, new Beacon(humanoid.RootPart, player.DisplayName));
			});
		};

		const initPlayer = (player: Player) => {
			if (player === LocalPlayer.player) return;
			if (player.Character) createPlayerBeacon(player);

			player.CharacterAdded.Connect(() => createPlayerBeacon(player));
			player.CharacterRemoving.Connect(() => playerBeacons.remove(player.UserId));
		};
		this.event.subscribeCollectionAdded(PlayerWatcher.players, initPlayer, true);

		return component;
	}
}
