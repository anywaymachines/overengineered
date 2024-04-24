import { GuiService, Players } from "@rbxts/services";
import { InputController } from "client/controller/InputController";
import { LocalPlayerController } from "client/controller/LocalPlayerController";
import { Gui } from "client/gui/Gui";
import { BlockManager } from "shared/building/BlockManager";
import { SharedPlots } from "shared/building/SharedPlots";
import { ObservableCollectionSet } from "shared/event/ObservableCollection";
import { PlayerUtils } from "shared/utils/PlayerUtils";

export namespace MultiBlockSelect {
	export function getTargetedPart(): BasePart | undefined {
		if (GuiService.MenuIsOpen || !PlayerUtils.isAlive(Players.LocalPlayer) || Gui.isCursorOnVisibleGui()) {
			return;
		}

		return LocalPlayerController.mouse.Target;
	}
	export function getTargetedBlock(): BlockModel | undefined {
		const target = getTargetedPart();
		if (!target?.Parent || !BlockManager.isBlockPart(target)) {
			return;
		}

		const parentPlot = SharedPlots.getPlotByBlock(target.Parent);
		if (parentPlot) {
			if (!SharedPlots.isBuildingAllowed(parentPlot, Players.LocalPlayer)) {
				return;
			}
		}

		return target.Parent;
	}

	export function selectBlocksByClick(
		selected: ObservableCollectionSet<BlockModel>,
		blocks: readonly BlockModel[],
		add: boolean,
	): void {
		const pc = InputController.inputType.get() === "Desktop";

		if (pc && !add) {
			selected.clear();
		}

		if (blocks.size() === 0) {
			return;
		}

		const allBlocksAlreadySelected = blocks.all((b) => selected.has(b));
		if (!allBlocksAlreadySelected) {
			selected.add(...blocks);
		} else {
			for (const block of blocks) {
				const existing = selected.has(block);
				if (existing) {
					selected.remove(block);

					continue;
				}

				selected.add(block);
			}
		}
	}
}
