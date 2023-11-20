export default abstract class BlockLogic {
	protected block: Model;

	constructor(block: Model) {
		this.block = block;
	}

	public abstract isTicking(): boolean;

	public abstract tick(block: Model, deltaTime: number): void;

	public abstract prepareLogic(block: Model): void;
}
