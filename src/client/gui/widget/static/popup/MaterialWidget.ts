import StaticWidget from "client/base/StaticWidget";
import GuiController from "client/controller/GuiController";
import SoundController from "client/controller/SoundController";
import GuiAnimator from "client/gui/GuiAnimator";
import BuildingManager from "shared/building/BuildingManager";

export default class MaterialWidget extends StaticWidget {
	private gui: MaterialGui;
	private template: MaterialGuiButton;
	private buttons: (typeof this.template)[] = [];

	constructor() {
		super();
		this.gui = this.getGui();

		this.template = this.gui.Answers.Template.Clone();
		this.gui.Answers.Template.Destroy();
	}

	private getGui() {
		if (!(this.gui && this.gui.Parent !== undefined)) {
			this.gui = GuiController.getGameUI().MaterialGui;
		}

		return this.gui;
	}

	private customPrepare(callback: Callback): void {
		super.prepare();

		// Events
		this.eventHandler.subscribeOnce(this.gui.CloseButton.MouseButton1Click, () => {
			this.hideWidget();
			SoundController.getSounds().GuiClick.Play();
		});

		this.buttons.forEach((element) => {
			element.Destroy();
		});

		BuildingManager.AllowedMaterials.forEach((material) => {
			const obj = this.template.Clone();

			obj.Name = material.Name;
			obj.TextLabel.Text = material.Name;
			this.eventHandler.subscribe(obj.MouseButton1Click, () => {
				this.gui.Visible = false;
				this.eventHandler.unsubscribeAll();
				SoundController.getSounds().GuiClick.Play();
				callback(material);
			});

			obj.Parent = this.gui.Answers;
			this.buttons.push(obj);
		});
	}

	protected prepareDesktop(): void {}

	protected prepareGamepad(): void {}

	protected prepareTouch(): void {}

	display(heading: string, callback: Callback): void {
		if (this.isVisible()) {
			return;
		}

		// Display
		this.gui.Visible = true;
		GuiAnimator.transition(this.gui, 0.2, "up");

		// Update texts
		this.gui.HeadingLabel.Text = heading;

		this.customPrepare((material: Enum.Material) => {
			this.hideWidget();
			callback(material);
		});
	}

	hideWidget(): void {
		super.hideWidget();

		this.gui.Visible = false;
	}

	isVisible(): boolean {
		return this.gui.Visible;
	}
}
