import { GuiService, Players, Workspace } from "@rbxts/services";
import { InputController } from "client/controller/InputController";
import { LocalPlayerController } from "client/controller/LocalPlayerController";
import { Gui } from "client/gui/Gui";
import { BlockManager } from "shared/building/BlockManager";
import { PlayerUtils } from "shared/utils/PlayerUtils";
import type { ObservableCollectionSet } from "shared/event/ObservableCollection";

export namespace BlockSelect {
	export const blockRaycastParams = new RaycastParams();
	blockRaycastParams.FilterType = Enum.RaycastFilterType.Include;

	export function getTargetedPart(): BasePart | undefined {
		if (GuiService.MenuIsOpen || !PlayerUtils.isAlive(Players.LocalPlayer) || Gui.isCursorOnVisibleGui()) {
			return;
		}

		const mouseRay = LocalPlayerController.mouse.UnitRay;
		return Workspace.Raycast(mouseRay.Origin, mouseRay.Direction.mul(1000), blockRaycastParams)?.Instance;
	}
	export function getTargetedBlock(): BlockModel | undefined {
		return BlockManager.tryGetBlockModelByPart(getTargetedPart());
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
