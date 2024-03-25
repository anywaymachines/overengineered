import { LocalizationService, Players } from "@rbxts/services";
import Control from "client/gui/Control";
import Gui from "client/gui/Gui";
import GuiAnimator from "client/gui/GuiAnimator";

export type TutorialControlDefinition = Frame & {
	Header: TextLabel & {
		Cancel: TextButton;
		Next: TextButton;
	};
	TextLabel: TextLabel;
};

export default class TutorialControl extends Control<TutorialControlDefinition> {
	private cancellable = false;

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

	private translate(text: string) {
		try {
			const translator = LocalizationService.GetTranslatorForLocaleAsync(Players.LocalPlayer.LocaleId);
			return translator.Translate(game, text);
		} catch {
			return text;
		}
	}

	isActive() {
		return this.gui.Visible;
	}

	startTutorial(name: string, cancellable: boolean) {
		this.gui.Header.Text = name;
		this.cancellable = cancellable;

		this.show();
	}

	displayStep(text: string, nextButtonActive?: boolean) {
		this.gui.TextLabel.Text = "";
		this.gui.Header.Cancel.Visible = false;
		this.gui.Header.Next.Visible = false;

		const translatedText = this.translate(text);
		const symbols = translatedText.split("");

		// Animated text for tutorial
		for (const symbol of symbols) {
			this.gui.TextLabel.Text = this.gui.TextLabel.Text + symbol;
			task.wait(0.05);
		}

		this.gui.Header.Next.Visible = nextButtonActive ?? false;
		this.gui.Header.Cancel.Visible = this.cancellable;
	}

	finish() {
		this.hide();
	}
}
