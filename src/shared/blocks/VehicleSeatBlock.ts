import { RunService, Players } from "@rbxts/services";
import { BlockLogic } from "shared/blockLogic/BlockLogic";
import type { BlockConfigBothDefinitions, PlacedBlockData2 } from "shared/blockLogic/BlockLogic";
import type { SharedMachine } from "shared/blockLogic/SharedMachine";

const config = {
	input: {},
	output: {
		occupied: {
			displayName: "Occupied",
			defaultType: "bool",
			types: {
				bool: {
					config: false,
					default: false,
				},
			},
		},
	},
} satisfies BlockConfigBothDefinitions;

type VehicleSeatModel = BlockModel & {
	readonly VehicleSeat: VehicleSeat;
};

@injectable
export class VehicleSeatBlockLogic extends BlockLogic<typeof config, VehicleSeatModel> {
	readonly vehicleSeat;

	constructor(block: PlacedBlockData2, @inject machine: SharedMachine) {
		super(block, config);

		this.vehicleSeat = this.instance.VehicleSeat;

		const update = () => {
			const occupant = this.vehicleSeat.Occupant;
			if (RunService.IsClient()) {
				machine.occupiedByLocalPlayer.set(occupant?.Parent === Players.LocalPlayer.Character);
			}

			this.output.occupied.set("bool", occupant !== undefined);
		};

		this.event.subscribe(this.vehicleSeat.GetPropertyChangedSignal("Occupant"), update);
		this.onEnable(update);
	}
}

export const VehicleSeatBlock = {
	id: "vehicleseat",
	name: "Driver seat",
	description: "A seat for your vehicle. Allows you to control your contraption",

	logic: { config, ctor: VehicleSeatBlockLogic },
} as const satisfies Block;
