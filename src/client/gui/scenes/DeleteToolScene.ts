import Scene from "client/base/Scene";
import DeleteTool from "client/tools/DeleteTool";

export type DeleteToolSceneDefinition = GuiObject & {
	TouchControls: Frame;
	DeleteAllButton: GuiButton;
};

export default class DeleteToolScene extends Scene<DeleteToolSceneDefinition> {
	constructor(gui: DeleteToolSceneDefinition, tool: DeleteTool) {
		super(gui);

		this.eventHandler.subscribe(this.gui.DeleteAllButton.MouseButton1Click, () => this.suggestClearAll());
	}

	private suggestClearAll() {}
}
