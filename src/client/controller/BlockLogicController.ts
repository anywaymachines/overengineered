import { Players } from "@rbxts/services";
import BlockLogic from "client/base/BlockLogic";
import LogicRegistry, { AnyBlockLogic } from "client/blocks/LogicRegistry";
import Logger from "shared/Logger";
import SharedPlots from "shared/building/SharedPlots";
import BlockRegistry from "shared/registry/BlocksRegistry";

export default class BlockLogicController {
	static setupBlocks() {
		const plot = SharedPlots.getPlotByOwnerID(Players.LocalPlayer.UserId);
		const blocks = SharedPlots.getPlotBlocks(plot).GetChildren();

		for (let i = 0; i < blocks.size(); i++) {
			const block = blocks[i] as Model;

			const id = block.GetAttribute("id") as string;

			if (BlockRegistry.Blocks.get(id) === undefined) {
				Logger.info(`Unknown block id ${id}`);
				continue;
			}

			const logic = LogicRegistry.Blocks.get(BlockRegistry.Blocks.get(id)!) as AnyBlockLogic | undefined;

			if (logic === undefined) {
				//Logger.info(`No script for block with id ${id}`);
				continue;
			}

			new logic(block);
		}
	}
}
