import { Players, RunService } from "@rbxts/services";
import { InstanceBlockLogic as InstanceBlockLogic } from "shared/blockLogic/BlockLogic";
import { BlockCreation } from "shared/blocks/BlockCreation";
import { SharedPlots } from "shared/building/SharedPlots";
import { CustomRemotes } from "shared/Remotes";
import { TagUtils } from "shared/utils/TagUtils";
import type { BlockLogicFullBothDefinitions, InstanceBlockLogicArgs } from "shared/blockLogic/BlockLogic";
import type { BlockBuilder } from "shared/blocks/Block";

const definition = {
	input: {
		relativePositioning: {
			displayName: "Object-Relative Output",
			tooltip: "Returns coordinates relative to this block instead of relative to global grid",
			types: {
				bool: {
					config: true,
				},
			},
		},
	},
	output: {
		targetsAmount: {
			displayName: "Locked Targets Amount",
			types: ["number"],
		},
		target1: {
			displayName: "Target 1 Offset",
			types: ["vector3"],
		},
		target2: {
			displayName: "Target 2 Offset",
			types: ["vector3"],
		},
		target3: {
			displayName: "Target 3 Offset",
			types: ["vector3"],
		},
		target4: {
			displayName: "Target 4 Offset",
			types: ["vector3"],
		},
	},
} satisfies BlockLogicFullBothDefinitions;

const ownDetectablesSet = new Set<BasePart>();

if (RunService.IsClient()) {
	const p = Players.LocalPlayer;
	CustomRemotes.modes.set.sent.Connect(({ mode }) => {
		if (mode === "ride") {
			const blocks = SharedPlots.instance.getPlotComponentByOwnerID(p.UserId).getBlocks();

			for (const b of blocks) {
				if (!b.PrimaryPart) continue;
				ownDetectablesSet.add(b.PrimaryPart);
			}
			return;
		}

		ownDetectablesSet.clear();
	});
}

export type { Logic as RadarWarningReceiverBlockLogic };
@injectable
class Logic extends InstanceBlockLogic<typeof definition> {
	constructor(block: InstanceBlockLogicArgs) {
		super(definition, block);

		const detectedSet = new Set<BasePart | UnionOperation | MeshPart>();
		const outputs = [this.output.target1, this.output.target2, this.output.target3, this.output.target4];

		const getPosition = (part: BasePart | UnionOperation | MeshPart, isRelative: boolean): Vector3 => {
			if (isRelative) this.instance.GetPivot().ToObjectSpace(part.GetPivot()).Position;
			return part.GetPivot().Position.sub(this.instance.GetPivot().Position);
		};

		const isRelative = this.initializeInputCache("relativePositioning");
		this.event.subscribe(RunService.Stepped, () => {
			const len = detectedSet.size();
			const arr = detectedSet.toArray();

			for (let i = 0; i < outputs.size(); i++) {
				const pp = (arr[i]?.Parent as Model)?.PrimaryPart;
				if (!pp) continue;

				outputs[i].set("vector3", i > len ? Vector3.zero : getPosition(pp, isRelative.get()));
			}

			this.output.targetsAmount.set("number", len);
		});

		this.event.subscribe(block.instance.PrimaryPart!.Touched, (part) => {
			if (!part.HasTag(TagUtils.allTags.SPECIAL_RADARVIEW)) return;
			detectedSet.add(part);
		});

		this.event.subscribe(block.instance.PrimaryPart!.TouchEnded, (part) => {
			if (!part.HasTag(TagUtils.allTags.SPECIAL_RADARVIEW)) return;
			detectedSet.delete(part);
		});
	}
}

export const RadarWarningReceiver = {
	...BlockCreation.defaults,
	id: "radarwarningreceiver",
	displayName: "Radar Warning Receiver",
	description: "Returns the positions of the radars that can be tracking the block.",
	search: {
		aliases: ["rwr"],
	},
	logic: { definition, ctor: Logic },
} as const satisfies BlockBuilder;
