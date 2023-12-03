import BlockLogic from "client/base/BlockLogic";

export default class VehicleSeatBlockLogic extends BlockLogic {
	public readonly occupant;
	public readonly vehicleSeat;

	constructor(block: Model) {
		super(block);

		this.vehicleSeat = block.WaitForChild("VehicleSeat") as VehicleSeat;
		this.occupant = this.event.observableFromGuiParam(this.vehicleSeat, "Occupant");
	}
}
