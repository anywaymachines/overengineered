import ConfigurableBlockLogic from "client/base/ConfigurableBlockLogic";

type RopeConfig = {
	readonly length: "number";
};

export default class RopeLogic extends ConfigurableBlockLogic<RopeConfig> {
	private ropeSide: BasePart;
	private ropeConstraint: RopeConstraint;

	constructor(block: Model) {
		super(block, RopeLogic.getConfigDefinition());

		this.ropeSide = block.FindFirstChild("RopeSide") as BasePart;
		this.ropeConstraint = this.ropeSide.FindFirstChild("RopeConstraint") as RopeConstraint;
	}

	protected prepare() {
		super.prepare();

		this.ropeConstraint.Length = this.config.get("length");
	}

	static getConfigDefinition(): ConfigTypesToDefinition<RopeConfig> {
		return {
			length: {
				displayName: "Length",
				type: "number",
				min: 2,
				max: 50,
				step: 1,
				default: {
					Desktop: 15,
				},
			},
		};
	}
}
