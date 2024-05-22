import { blockConfigRegistry } from "shared/block/config/BlockConfigRegistry";
import { ConfigurableBlockLogic } from "shared/block/ConfigurableBlockLogic";
import type { PlacedBlockData } from "shared/building/BlockManager";

type _VehicleSeat = BlockModel & {
	readonly VehicleSeat: VehicleSeat;
};
export class PassengerSeatBlockLogic extends ConfigurableBlockLogic<
	typeof blockConfigRegistry.passengerseat,
	_VehicleSeat
> {
	constructor(block: PlacedBlockData) {
		super(block, blockConfigRegistry.passengerseat);

		const occupant = this.event.readonlyObservableFromInstanceParam(this.instance.VehicleSeat, "Occupant");

		const update = () => this.output.occupied.set(occupant.get() !== undefined);
		occupant.subscribe(() => update());
		this.output.occupied.set(false);
		this.onEnable(update);
	}
}
