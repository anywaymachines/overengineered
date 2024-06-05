import { Players, RunService } from "@rbxts/services";
import { blockConfigRegistry } from "shared/block/config/BlockConfigRegistry";
import { ConfigurableBlockLogic } from "shared/block/ConfigurableBlockLogic";
import { ObservableValue } from "shared/event/ObservableValue";
import type { PlacedBlockData } from "shared/building/BlockManager";

type _VehicleSeat = BlockModel & {
	readonly VehicleSeat: VehicleSeat;
};
export class VehicleSeatBlockLogic extends ConfigurableBlockLogic<
	typeof blockConfigRegistry.vehicleseat,
	_VehicleSeat
> {
	readonly occupiedByLocalPlayer = new ObservableValue(RunService.IsClient());
	readonly vehicleSeat;
	private readonly occupant;

	constructor(block: PlacedBlockData) {
		super(block, blockConfigRegistry.vehicleseat);

		this.vehicleSeat = this.instance.VehicleSeat;
		this.occupant = this.event.readonlyObservableFromInstanceParam(this.vehicleSeat, "Occupant");

		const update = () => {
			const occupant = this.occupant.get();
			if (RunService.IsClient()) {
				this.occupiedByLocalPlayer.set(occupant?.Parent === Players.LocalPlayer.Character);
			}

			this.output.occupied.set(occupant !== undefined);
		};

		this.occupant.subscribe(() => update());
		this.output.occupied.set(false);
		this.onEnable(update);
	}
}
