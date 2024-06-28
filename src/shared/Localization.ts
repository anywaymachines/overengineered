import { LocalizationService } from "@rbxts/services";

export namespace Localization {
	/**
	Translates any registered english words to player's language
	@argument player Player object
	@argument text Text to translate
	*/
	export function translateForPlayer(player: Player, text: string) {
		try {
			const translator = LocalizationService.GetTranslatorForLocaleAsync(player.LocaleId);
			return translator.Translate(game, text);
		} catch {
			return text;
		}
	}
}
