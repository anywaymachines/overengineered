import { ServerBlockLogic } from "server/blocks/ServerBlockLogic";
import type { PlayModeController } from "server/modes/PlayModeController";
import type { SevenSegmentDisplayBlockLogic } from "shared/block/logic/logic/display/SevenSegmentDisplayBlockLogic";

@injectable
export class SevenSegmentDisplayServerLogic extends ServerBlockLogic<typeof SevenSegmentDisplayBlockLogic> {
	private readonly SEGMENT_LETTERS: { [key: string]: string[] } = {
		"0": ["A", "B", "C", "D", "E", "F"],
		"1": ["E", "F"],
		"2": ["A", "F", "G", "C", "D"],
		"3": ["A", "G", "D", "E", "F"],
		"4": ["B", "F", "G", "E"],
		"5": ["A", "B", "G", "E", "D"],
		"6": ["A", "B", "G", "E", "D", "C"],
		"7": ["E", "F", "A"],
		"8": ["A", "B", "C", "D", "E", "F", "G"],
		"9": ["A", "B", "D", "E", "F", "G"],
		A: ["A", "B", "C", "E", "F", "G"],
		B: ["B", "C", "D", "E", "G"],
		C: ["A", "B", "C", "D"],
		D: ["C", "D", "E", "F", "G"],
		E: ["A", "B", "C", "D", "G"],
		F: ["A", "B", "C", "G"],
	};

	constructor(logic: typeof SevenSegmentDisplayBlockLogic, @inject playModeController: PlayModeController) {
		super(logic, playModeController);

		logic.events.update.invoked.Connect((player, { block, code }) => {
			if (!this.isValidBlock(block, player)) return;

			const letters = string.format("%02X", code).split("");
			this.setEnabled(block, "L", this.SEGMENT_LETTERS[letters[0]]);
			this.setEnabled(block, "R", this.SEGMENT_LETTERS[letters[1]]);
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
