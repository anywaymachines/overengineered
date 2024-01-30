import ConfigurableBlockLogic from "client/base/ConfigurableBlockLogic";
import LocalPlayerController from "client/controller/LocalPlayerController";
import blockConfigRegistry from "shared/BlockConfigRegistry";
import { PlacedBlockData } from "shared/building/BlockManager";
import ObservableValue from "shared/event/ObservableValue";

type _VehicleSeat = BlockModel & {
	readonly VehicleSeat: VehicleSeat;
};
export default class VehicleSeatBlockLogic extends ConfigurableBlockLogic<
	typeof blockConfigRegistry.vehicleseat,
	_VehicleSeat
> {
	public readonly occupiedByLocalPlayer = new ObservableValue(true);
	public readonly vehicleSeat;
	private readonly occupant;

	constructor(block: PlacedBlockData) {
		super(block, blockConfigRegistry.vehicleseat);

		this.vehicleSeat = this.instance.VehicleSeat;
		this.occupant = this.event.observableFromGuiParam(this.vehicleSeat, "Occupant");

		const update = (force = false) => {
			const occupant = this.occupant.get();

			this.occupiedByLocalPlayer.set(occupant === LocalPlayerController.humanoid, force);
			this.output.occupied.set(occupant !== undefined, force);
		};

		this.occupant.subscribe(() => update());
		this.event.onPrepare(() => update(true));
	}
}
