import { Players } from "@rbxts/services";
import Signal from "@rbxts/signal";
import BlockLogic from "client/base/BlockLogic";
import ComponentContainer from "client/base/ComponentContainer";
import Logger from "shared/Logger";
import SharedPlots from "shared/building/SharedPlots";
import BlockRegistry from "shared/registry/BlocksRegistry";
import LogicRegistry, { AnyBlockLogic } from "../LogicRegistry";
import VehicleSeatBlockLogic from "./VehicleSeatBlockLogic";

export default class Machine extends ComponentContainer<BlockLogic> {
	public readonly destroyed = new Signal<() => void>();
	public readonly seat;

	constructor(logics: readonly BlockLogic[]) {
		super();

		const seat = logics.find((l) => l instanceof VehicleSeatBlockLogic) as VehicleSeatBlockLogic | undefined;
		if (!seat) throw "No seat found";
		this.seat = seat;

		for (const logic of logics) {
			this.add(logic);
		}

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

	public destroy() {
		this.destroyed.Fire();
		super.destroy();
	}

	public static fromBlocks() {
		const plot = SharedPlots.getPlotByOwnerID(Players.LocalPlayer.UserId);
		const blocks = SharedPlots.getPlotBlocks(plot).GetChildren();

		const logics: BlockLogic[] = [];

		for (let i = 0; i < blocks.size(); i++) {
			const block = blocks[i] as Model;
			const id = block.GetAttribute("id") as string;

			if (BlockRegistry.Blocks.get(id) === undefined) {
				Logger.info(`Unknown block id ${id}`);
				continue;
			}

			const ctor = LogicRegistry.Blocks.get(BlockRegistry.Blocks.get(id)!) as AnyBlockLogic | undefined;

			if (ctor === undefined) {
				//Logger.info(`No script for block with id ${id}`);
				continue;
			}

			const logic = new ctor(block);
			logics.push(logic);
		}

		const machine = new Machine(logics);
		machine.enable();

		return machine;
	}
}
