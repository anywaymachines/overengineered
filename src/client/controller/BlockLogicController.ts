import { Players } from "@rbxts/services";
import BlockLogic from "client/base/BlockLogic";
import LogicRegistry, { AnyBlockLogic } from "client/blocks/LogicRegistry";
import Machine from "client/blocks/logic/Machine";
import Logger from "shared/Logger";
import SharedPlots from "shared/building/SharedPlots";
import BlockRegistry from "shared/registry/BlocksRegistry";

export default class BlockLogicController {
	private static readonly blocks: BlockLogic[] = [];

	static setupBlocks() {
		const plot = SharedPlots.getPlotByOwnerID(Players.LocalPlayer.UserId);
		const blocks = SharedPlots.getPlotBlocks(plot).GetChildren();

		const machine = new Machine();
		machine.enable();

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
			this.blocks.push(logic);
			machine.add(logic);
		}

		return machine;
	}

	public static getBlocks() {
		return this.blocks as readonly BlockLogic[];
	}
}
