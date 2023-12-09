import { Players, RunService } from "@rbxts/services";
import Signal from "@rbxts/signal";
import BlockLogic from "client/base/BlockLogic";
import ComponentContainer from "client/base/ComponentContainer";
import Logger from "shared/Logger";
import { blockRegistry } from "shared/Registry";
import SharedPlots from "shared/building/SharedPlots";
import logicRegistry from "../LogicRegistry";
import VehicleSeatBlockLogic from "./VehicleSeatBlockLogic";

export default class Machine extends ComponentContainer<BlockLogic> {
	public readonly destroyed = new Signal<() => void>();
	public readonly seat: VehicleSeatBlockLogic;

	constructor(logics: readonly BlockLogic[]) {
		super();

		const seat = logics.find((l) => l instanceof VehicleSeatBlockLogic) as VehicleSeatBlockLogic | undefined;
		if (!seat) throw "No seat found";
		this.seat = seat;

		for (const logic of logics) {
			this.add(logic);
		}

		const maxAngularVelocity = 50;
		const maxLinearVelocity = 800;
		this.event.subscribe(RunService.Heartbeat, () => {
			const currentAngularVelocity = this.seat.vehicleSeat.AssemblyAngularVelocity;
			this.seat.vehicleSeat.AssemblyAngularVelocity = new Vector3(
				math.clamp(currentAngularVelocity.X, -maxAngularVelocity, maxAngularVelocity),
				math.clamp(currentAngularVelocity.Y, -maxAngularVelocity, maxAngularVelocity),
				math.clamp(currentAngularVelocity.Z, -maxAngularVelocity, maxAngularVelocity),
			);

			const currentLinearVelocity = this.seat.vehicleSeat.AssemblyLinearVelocity;
			this.seat.vehicleSeat.AssemblyLinearVelocity = new Vector3(
				math.clamp(currentLinearVelocity.X, -maxLinearVelocity, maxLinearVelocity),
				math.clamp(currentLinearVelocity.Y, -maxLinearVelocity, maxLinearVelocity),
				math.clamp(currentLinearVelocity.Z, -maxLinearVelocity, maxLinearVelocity),
			);
		});
	}

	public add(instance: BlockLogic<Model>) {
		instance.machine = this;
		super.add(instance);
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

			if (blockRegistry.get(id) === undefined) {
				Logger.error(`Unknown block id ${id}`);
				continue;
			}

			const ctor = logicRegistry[id];
			if (!ctor) {
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
