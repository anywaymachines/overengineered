import { Players } from "@rbxts/services";
import ConfigurableBlockLogic from "client/base/ConfigurableBlockLogic";
import blockConfigRegistry from "shared/BlockConfigRegistry";
import ObservableValue from "shared/event/ObservableValue";

export default class VehicleSeatBlockLogic extends ConfigurableBlockLogic<typeof blockConfigRegistry.vehicleseat> {
	public readonly occupiedByLocalPlayer = new ObservableValue(false);
	public readonly vehicleSeat;
	private readonly occupant;

	constructor(block: BlockModel) {
		super(block, blockConfigRegistry.vehicleseat);

		this.vehicleSeat = block.WaitForChild("VehicleSeat") as VehicleSeat;
		this.occupant = this.event.observableFromGuiParam(this.vehicleSeat, "Occupant");

		const update = (force = false) => {
			const occupant = this.occupant.get();

			this.occupiedByLocalPlayer.set(occupant === Players.LocalPlayer.Character!.WaitForChild("Humanoid"), force);
			this.output.occupied.set(occupant !== undefined, force);
		};

		this.occupant.subscribe(() => update(), true);
		this.event.onPrepare(() => update(true));
	}
}
