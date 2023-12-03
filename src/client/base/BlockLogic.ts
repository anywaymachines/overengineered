import Component from "./Component";

export default abstract class BlockLogic<T extends Model = Model> extends Component<T> {
	protected readonly block: Model;

	constructor(block: T) {
		super(block);
		this.block = block;
	}
}
