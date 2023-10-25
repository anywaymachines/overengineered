import { LocalizationService, Players } from "@rbxts/services";
import Logger from "shared/Logger";

export default class GameLocalization {
	static getLocalizedString(gui: GuiObject, text: string) {
		try {
			const translator = LocalizationService.GetTranslatorForPlayerAsync(Players.LocalPlayer);
			return translator.Translate(gui, text);
		} catch (error) {
			Logger.info("[LOCALE] Unable to load locale manager");
		}

		return text;
	}
}
