import { Players, RunService } from "@rbxts/services";
import blockConfigRegistry from "shared/block/config/BlockConfigRegistry";
import { PlacedBlockData } from "shared/building/BlockManager";
import ObservableValue from "shared/event/ObservableValue";
import ConfigurableBlockLogic from "shared/block/ConfigurableBlockLogic";

type _VehicleSeat = BlockModel & {
	readonly VehicleSeat: VehicleSeat;
};
export default class VehicleSeatBlockLogic extends ConfigurableBlockLogic<
	typeof blockConfigRegistry.vehicleseat,
	_VehicleSeat
> {
	public readonly occupiedByLocalPlayer = new ObservableValue(RunService.IsClient());
	public readonly vehicleSeat;
	private readonly occupant;

	constructor(block: PlacedBlockData) {
		super(block, blockConfigRegistry.vehicleseat);

		this.vehicleSeat = this.instance.VehicleSeat;
		this.occupant = this.event.readonlyObservableFromInstanceParam(this.vehicleSeat, "Occupant");

		const update = (force = false) => {
			const occupant = this.occupant.get();
			if (RunService.IsClient()) {
				this.occupiedByLocalPlayer.set(occupant?.Parent === Players.LocalPlayer.Character, force);
			}

			this.output.occupied.set(occupant !== undefined, force);
		};

		this.occupant.subscribe(() => update());
		this.event.onEnable(() => update(true));
	}
}
