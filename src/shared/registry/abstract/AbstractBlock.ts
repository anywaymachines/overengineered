import AbstractCategory from "./AbstractCategory";
import BlockLogic from "./BlockLogic";

export default abstract class AbstractBlock {
	public readonly id: string;

	/**
	 * @param id The id of the block `ExampleBlock`
	 */
	constructor(id: string) {
		this.id = id;
	}

	/** Must return the **displayed** name of the block */
	public abstract getDisplayName(): string;

	/** Must return the **block model** object that will be used for construction */
	public abstract getModel(): Model;

	/** Must return the **category* */
	public abstract getCategory(): AbstractCategory | undefined;

	/** Returns block's logic */
	public getScript(): BlockLogic | undefined {
		return undefined;
	}

	public getLimit(): number {
		return 500;
	}

	public isRequired(): boolean {
		return false;
	}

	/** Enables locking of rotary axes */
	public getAvailableRotationAxis(): {
		x: boolean;
		y: boolean;
		z: boolean;
	} {
		return { x: true, y: true, z: true };
	}
}
