import { Players } from "@rbxts/services";
import ConfigurableBlockLogic from "client/base/ConfigurableBlockLogic";
import blockConfigRegistry from "shared/BlockConfigRegistry";
import ObservableValue from "shared/event/ObservableValue";

export default class VehicleSeatBlockLogic extends ConfigurableBlockLogic<typeof blockConfigRegistry.seat> {
	public readonly occupiedByLocalPlayer = new ObservableValue(false);
	public readonly vehicleSeat;
	private readonly occupant;

	constructor(block: BlockModel) {
		super(block, blockConfigRegistry.seat);

		this.vehicleSeat = block.WaitForChild("VehicleSeat") as VehicleSeat;
		this.occupant = this.event.observableFromGuiParam(this.vehicleSeat, "Occupant");

		this.occupant.subscribe((occupant) => {
			this.occupiedByLocalPlayer.set(occupant === Players.LocalPlayer.Character!.WaitForChild("Humanoid"));
			this.logicConfig.outputs.occupied.set(occupant !== undefined);
		}, true);
	}
}
