import { Players, RunService } from "@rbxts/services";
import { Control } from "client/gui/Control";
import { Gui } from "client/gui/Gui";
import { GuiAnimator } from "client/gui/GuiAnimator";
import { Localization } from "shared/Localization";

export type TutorialControlDefinition = Frame & {
	Header: TextLabel & {
		Cancel: TextButton;
		Next: TextButton;
	};
	TextLabel: TextLabel;
};

export class TutorialControl extends Control<TutorialControlDefinition> {
	private cancellable = false;
	private active = false;

	constructor() {
		super(Gui.getGameUI().FindFirstChild("Tutorial") as TutorialControlDefinition);
	}

	/** @deprecated Do not use outside */
	show(): void {
		this.gui.Visible = true;
		GuiAnimator.transition(this.gui, 0.2, "down");
	}

	/** @deprecated Do not use outside */
	hide(): void {
		GuiAnimator.hide(this.gui, 0.2, "down");
	}

	isActive() {
		return this.active;
	}

	startTutorial(name: string, cancellable: boolean) {
		if (this.isActive()) return false;

		this.active = true;
		this.gui.Header.Text = name;
		this.cancellable = cancellable;

		this.show();
		return true;
	}

	displayStep(text: string, nextButtonActive?: boolean) {
		this.gui.TextLabel.Text = "";
		this.gui.Header.Cancel.Visible = false;
		this.gui.Header.Next.Visible = false;

		const translatedText = Localization.translateForPlayer(Players.LocalPlayer, text);

		// Animated text for tutorial
		for (const symbol of translatedText) {
			this.gui.TextLabel.Text = this.gui.TextLabel.Text + symbol;
			task.wait(RunService.IsStudio() ? 0 : 0.05);
		}

		this.gui.Header.Next.Visible = nextButtonActive ?? false;
		this.gui.Header.Cancel.Visible = this.cancellable;
	}

	finish() {
		this.active = false;
		this.hide();
	}
}
