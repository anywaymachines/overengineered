import { Players } from "@rbxts/services";
import BlockLogic from "client/base/BlockLogic";
import ObservableValue from "shared/event/ObservableValue";

export default class VehicleSeatBlockLogic extends BlockLogic {
	public readonly occupiedByLocalPlayer = new ObservableValue(false);
	public readonly vehicleSeat;
	private readonly occupant;

	constructor(block: Model) {
		super(block);

		this.vehicleSeat = block.WaitForChild("VehicleSeat") as VehicleSeat;
		this.occupant = this.event.observableFromGuiParam(this.vehicleSeat, "Occupant");

		this.occupant.subscribe((occupant) => {
			this.occupiedByLocalPlayer.set(occupant === Players.LocalPlayer.Character!.WaitForChild("Humanoid"));
		}, true);
	}
}
