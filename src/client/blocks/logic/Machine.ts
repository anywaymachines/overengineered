import { Players, RunService } from "@rbxts/services";
import Signal from "@rbxts/signal";
import PlayerDataStorage from "client/PlayerDataStorage";
import BlockLogic from "client/base/BlockLogic";
import ComponentContainer from "client/base/ComponentContainer";
import ImpactController from "client/controller/ImpactController";
import GameDefinitions from "shared/GameDefinitions";
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

		// TODO: Option OR isPVP
		if (PlayerDataStorage.config.get().impact_destruction) {
			ImpactController.initializeBlocks();
		}

		this.event.subscribe(RunService.Heartbeat, () => {
			// Angular speed limit
			const currentAngularVelocity = this.seat.vehicleSeat.AssemblyAngularVelocity;
			this.seat.vehicleSeat.AssemblyAngularVelocity = new Vector3(
				math.clamp(
					currentAngularVelocity.X,
					-GameDefinitions.MAX_ANGULAR_SPEED,
					GameDefinitions.MAX_ANGULAR_SPEED,
				),
				math.clamp(
					currentAngularVelocity.Y,
					-GameDefinitions.MAX_ANGULAR_SPEED,
					GameDefinitions.MAX_ANGULAR_SPEED,
				),
				math.clamp(
					currentAngularVelocity.Z,
					-GameDefinitions.MAX_ANGULAR_SPEED,
					GameDefinitions.MAX_ANGULAR_SPEED,
				),
			);

			// Linear speed limit
			const currentLinearVelocity = this.seat.vehicleSeat.AssemblyLinearVelocity;
			this.seat.vehicleSeat.AssemblyLinearVelocity = new Vector3(
				math.clamp(
					currentLinearVelocity.X,
					-GameDefinitions.MAX_LINEAR_SPEED,
					GameDefinitions.MAX_LINEAR_SPEED,
				),
				math.clamp(
					currentLinearVelocity.Y,
					-GameDefinitions.MAX_LINEAR_SPEED,
					GameDefinitions.MAX_LINEAR_SPEED,
				),
				math.clamp(
					currentLinearVelocity.Z,
					-GameDefinitions.MAX_LINEAR_SPEED,
					GameDefinitions.MAX_LINEAR_SPEED,
				),
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
