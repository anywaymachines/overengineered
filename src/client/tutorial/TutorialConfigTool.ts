import { BuildingMode } from "client/modes/build/BuildingMode";
import { ClientBuilding } from "client/modes/build/ClientBuilding";
import { Tutorial } from "client/tutorial/Tutorial";
import { BlockManager } from "shared/building/BlockManager";
import { EventHandler } from "shared/event/EventHandler";
import { successResponse } from "shared/types/network/Responses";
import { VectorUtils } from "shared/utils/VectorUtils";

export type TutorialConfigBlockHighlight = {
	position: Vector3;
	key: string;
	value: BlockConfigTypes.Types[keyof BlockConfigTypes.Types]["config"];
};

export class TutorialConfigTool {
	private readonly eventHandler = new EventHandler();

	constructor(private readonly tutorial: typeof Tutorial) {
		this.eventHandler.register(
			ClientBuilding.resetConfigOperation.addMiddleware((plot, _blocks, args2) => {
				if (this.get().blocksToConfigure.size() > 0) {
					return { success: false, message: "Config reset is disabled during tutorial" };
				}

				return successResponse;
			}),
		);
	}

	get() {
		return BuildingMode.instance.toolController.configTool;
	}

	cleanup() {
		this.eventHandler.unsubscribeAll();
		this.get().blocksToConfigure.clear();
	}

	async waitForBlocksConfigure(): Promise<boolean> {
		return new Promise((resolve) => {
			const eventHandler = new EventHandler();

			eventHandler.register(
				ClientBuilding.updateConfigOperation.addMiddleware((plot, configs) => {
					configs.forEach((config) => {
						if (
							!this.get().blocksToConfigure.any(
								(value) =>
									value.key === config.key &&
									value.value === config.value &&
									value.position === VectorUtils.roundVector(config.block.GetPivot().Position),
							)
						) {
							return {
								success: false,
								message: `This config value required to be ${config.value} by tutorial`,
							};
						}
					});

					return successResponse;
				}),
			);

			eventHandler.subscribe(ClientBuilding.updateConfigOperation.executed, (plot) => {
				const configs = new Map(
					plot.getBlocks().map((block) => [block, BlockManager.manager.config.get(block)] as const),
				);
				const positions = this.get().blocksToConfigure.map((value) => value.position);

				const configs_filtered = configs.filter((value) => positions.includes(value.GetPivot().Position));
				configs_filtered.forEach((config) => {
					const block = this.get().blocksToConfigure.find((value) => value.position === config.position)!;
					if (block.key === config.key && block.value !== config.value) {
						return;
					}
				});

				eventHandler.unsubscribeAll();
				this.tutorial.Finish();
				resolve(false);
			});

			eventHandler.subscribeOnce(this.tutorial.Control.instance.Header.Cancel.MouseButton1Click, () => {
				eventHandler.unsubscribeAll();
				this.tutorial.Finish();
				resolve(false);
			});
		});
	}

	addBlockToConfigure(data: TutorialConfigBlockHighlight) {
		this.get().blocksToConfigure.push(data);
	}
}
