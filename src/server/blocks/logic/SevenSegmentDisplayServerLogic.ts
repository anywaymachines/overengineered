import { ServerBlockLogic } from "server/blocks/ServerBlockLogic";
import { SevenSegmentDisplayBlockLogic } from "shared/block/logic/operations/output/SevenSegmentDisplayBlockLogic";

export class SevenSegmentDisplayServerLogic extends ServerBlockLogic<typeof SevenSegmentDisplayBlockLogic> {
	constructor(logic: typeof SevenSegmentDisplayBlockLogic) {
		super(logic);

		logic.events.update.invoked.Connect((player, { block, code }) => {
			if (code === 0) {
				this.setEnabled(block, "L", ["A", "B", "C", "D", "E", "F"]); // 0
				this.setEnabled(block, "R", ["A", "B", "C", "D", "E", "F"]); // 0
			} else if (code === 1) {
				this.setEnabled(block, "L", ["A", "B", "C", "D", "E", "F"]); // 0
				this.setEnabled(block, "R", ["E", "F"]); // 1
			} else if (code === 2) {
				this.setEnabled(block, "L", ["A", "B", "C", "D", "E", "F"]); // 0
				this.setEnabled(block, "R", ["A", "F", "G", "C", "D"]); // 2
			} else if (code === 3) {
				this.setEnabled(block, "L", ["A", "B", "C", "D", "E", "F"]); // 0
				this.setEnabled(block, "R", ["A", "G", "D", "E", "F"]); // 3
			} else if (code === 4) {
				this.setEnabled(block, "L", ["A", "B", "C", "D", "E", "F"]); // 0
				this.setEnabled(block, "R", ["B", "F", "G", "E"]); // 4
			} else if (code === 5) {
				this.setEnabled(block, "L", ["A", "B", "C", "D", "E", "F"]); // 0
				this.setEnabled(block, "R", ["A", "B", "G", "E", "D"]); // 5
			} else if (code === 6) {
				this.setEnabled(block, "L", ["A", "B", "C", "D", "E", "F"]); // 0
				this.setEnabled(block, "R", ["A", "B", "G", "E", "D", "C"]); // 6
			} else if (code === 7) {
				this.setEnabled(block, "L", ["A", "B", "C", "D", "E", "F"]); // 0
				this.setEnabled(block, "R", ["E", "F", "C"]); // 7
			} else if (code === 8) {
				this.setEnabled(block, "L", ["A", "B", "C", "D", "E", "F"]); // 0
				this.setEnabled(block, "R", ["A", "B", "C", "D", "E", "F", "G"]); // 8
			} else if (code === 9) {
				this.setEnabled(block, "L", ["A", "B", "C", "D", "E", "F"]); // 0
				this.setEnabled(block, "R", ["A", "B", "D", "E", "F", "G"]); // 9
			} else if (code === 10) {
				this.setEnabled(block, "L", ["A", "B", "C", "D", "E", "F"]); // 0
				this.setEnabled(block, "R", ["A", "B", "C", "E", "F", "G"]); // A
			} else if (code === 11) {
				this.setEnabled(block, "L", ["A", "B", "C", "D", "E", "F"]); // 0
				this.setEnabled(block, "R", ["A", "B", "C", "D", "G"]); // B
			} else if (code === 12) {
				this.setEnabled(block, "L", ["A", "B", "C", "D", "E", "F"]); // 0
				this.setEnabled(block, "R", ["A", "B", "C", "D"]); // C
			} else if (code === 14) {
				this.setEnabled(block, "L", ["A", "B", "C", "D", "E", "F"]); // 0
				this.setEnabled(block, "R", ["A", "B", "C", "D", "G"]); // E
			} else if (code === 15) {
				this.setEnabled(block, "L", ["A", "B", "C", "D", "E", "F"]); // 0
				this.setEnabled(block, "R", ["A", "B", "C", "G"]); // F
			} else if (code === 16) {
				this.setEnabled(block, "L", ["E", "F"]); // 1
				this.setEnabled(block, "R", ["A", "B", "C", "D", "E", "F"]); // 0
			}
		});
	}

	private setEnabled(block: BlockModel, side: "R" | "L", enabled: string[]) {
		for (const id of ["A", "B", "C", "D", "E", "F", "G"]) {
			this.tryToGetSegmentAndSetState(block, side, id, enabled.includes(id));
		}
	}

	private tryToGetSegmentAndSetState(block: BlockModel, side: "L" | "R", id: string, state: boolean) {
		const segments = block.FindFirstChild(`Segments${side}`);
		if (!segments) return;

		const segment = segments.FindFirstChild(id) as BasePart | undefined;
		if (!segment) return;

		segment.Color = state ? Color3.fromRGB(150, 150, 150) : Color3.fromRGB(70, 67, 69);
	}
}
