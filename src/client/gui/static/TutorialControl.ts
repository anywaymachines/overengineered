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
	constructor() {
		super(Gui.getGameUI().FindFirstChild("Tutorial") as TutorialControlDefinition);
	}

	show(): void {
		this.gui.Visible = true;
		GuiAnimator.transition(this.gui, 0.2, "down");
	}

	async waitForNextButton() {
		return await new Promise((resolve) => this.gui.Header.Next.MouseButton1Click.Once(() => resolve(undefined)));
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
		this.gui.Header.Cancel.Visible = cancellable;

		this.show();
	}

	displayStep(text: string, nextButtonActive?: boolean) {
		this.gui.TextLabel.Text = "";
		this.gui.Header.Next.Visible = false;

		const translatedText = this.translate(text);
		const symbols = translatedText.split("");

		// Animated text for tutorial
		for (const symbol of symbols) {
			this.gui.TextLabel.Text = this.gui.TextLabel.Text + symbol;
			task.wait(0.05);
		}

		this.gui.Header.Next.Visible = nextButtonActive ?? false;
	}

	finish() {
		this.gui.Visible = false;
	}
}
