import Signal from "@rbxts/signal";
import BlockLogic from "client/base/BlockLogic";
import ObservableValue from "shared/event/ObservableValue";

export default class VehicleSeatBlockLogic extends BlockLogic {
	public static readonly occupant = new ObservableValue<Humanoid | undefined>(undefined);

	private vehicleSeat: VehicleSeat;

	constructor(block: Model) {
		super(block);
		this.vehicleSeat = block.WaitForChild("VehicleSeat") as VehicleSeat;

		this.setup();
	}

	protected setup() {
		super.setup();

		this.updateOccupant();
		this.eventHandler.subscribe(this.vehicleSeat.GetPropertyChangedSignal("Occupant"), () => this.updateOccupant());
	}

	private updateOccupant() {
		VehicleSeatBlockLogic.occupant.set(this.vehicleSeat.Occupant);
	}
}
