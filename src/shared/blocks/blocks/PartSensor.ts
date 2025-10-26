import { Players } from "@rbxts/services";
import { InstanceBlockLogic } from "shared/blockLogic/BlockLogic";
import { BlockCreation } from "shared/blocks/BlockCreation";
import { DisconnectBlock } from "shared/blocks/blocks/DisconnectBlock";
import { BuildingManager } from "shared/building/BuildingManager";
import { SharedPlots } from "shared/building/SharedPlots";
import { RemoteEvents } from "shared/RemoteEvents";
import type { BlockLogicFullBothDefinitions, InstanceBlockLogicArgs } from "shared/blockLogic/BlockLogic";
import type { BlockBuilder, BlockCategoryPath, BlockModelSource } from "shared/blocks/Block";

const autoModel = (prefab: BlockCreation.Model.PrefabName, text: string, category: BlockCategoryPath) => {
	return {
		model: BlockCreation.Model.fAutoCreated(prefab, text),
		category: () => category,
	} satisfies BlockModelSource;
};
const definition = {
	input: {
		mode: {
			displayName: "Mode",
			types: {
				enum: {
					config: "plot",
					elementOrder: ["assembly", "machine", "plot"],
					elements: {
						assembly: { displayName: "Assembly", tooltip: "Only parts welded to Part Sensor" },
						machine: { displayName: "Machine", tooltip: "Everything connected to the Part Sensor" },
						plot: { displayName: "Plot", tooltip: "The entire plot" },
					},
				},
			},
			connectorHidden: true,
		},
	},
	output: {
		result: {
			displayName: "Parts",
			types: ["number"],
		},
	},
} satisfies BlockLogicFullBothDefinitions;

export type { Logic as PartSensorBlockLogic };
class Logic extends InstanceBlockLogic<typeof definition> {
	constructor(block: InstanceBlockLogicArgs) {
		super(definition, block);

		const modeInputCache = this.initializeInputCache("mode");

		const update = () => {
			if (!this.instance.PrimaryPart) {
				this.disable();
				return;
			}

			const modeCache = modeInputCache.tryGet();
			if (modeCache === undefined) return;

			const buildSize = BuildingManager.getMachineBlocks(this.instance).size();
			const assemblySize = BuildingManager.getAssemblyBlocks(this.instance).size();
			const plotSize = SharedPlots.instance
				.getPlotComponentByOwnerID(Players.LocalPlayer.UserId)
				.getBlocks() // don't know any better method
				.size();

			if (modeCache === "assembly") {
				this.output.result.set("number", assemblySize - 1);
				return;
			}
			if (modeCache === "machine") {
				this.output.result.set("number", buildSize - 1);
				return;
			}
			if (modeCache === "plot") {
				this.output.result.set("number", plotSize - 1);
				return;
			}
		};

		this.event.subscribe(DisconnectBlock.logic.ctor.events.disconnect.senderInvoked, update);
		this.event.subscribe(RemoteEvents.ImpactBreak.senderInvoked, update);
		this.onFirstInputs(update);
	}
}

export const PartSensorBlock = {
	...BlockCreation.defaults,
	id: "partsensor",
	displayName: "Part Sensor",
	description: "Returns the amount of blocks in the build, machine, or assembly, not including itself",
	modelSource: autoModel("DoubleGenericLogicBlockPrefab", "PART SENSOR", BlockCreation.Categories.sensor),

	logic: { definition, ctor: Logic },
} as const satisfies BlockBuilder;
