import BlockLogic from "client/base/BlockLogic";
import ComponentContainer from "client/base/ComponentContainer";
import VehicleSeatBlockLogic from "./VehicleSeatBlockLogic";

export default class Machine extends ComponentContainer<BlockLogic> {
	public seat: VehicleSeatBlockLogic = undefined!;

	initializeSeat() {
		const seat = this.getChildren().find((c) => c instanceof VehicleSeatBlockLogic) as
			| VehicleSeatBlockLogic
			| undefined;
		if (!seat) throw "No seat found";
		this.seat = seat;

		this.event.subscribe(seat.vehicleSeat.GetPropertyChangedSignal("Occupant"), () => {
			const occupant = seat.vehicleSeat.Occupant;
			if (!occupant) {
				for (const child of this.getChildren()) {
					child.disable();
				}
			} else {
				for (const child of this.getChildren()) {
					child.enable();
				}
			}
		});
	}
}
