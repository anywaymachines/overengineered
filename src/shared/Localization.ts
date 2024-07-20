import { LocalizationService } from "@rbxts/services";

export namespace Localization {
	/**
	Translates any registered english words to player's language
	@argument player Player object
	@argument text Text to translate
	*/
	export function translateForPlayer(player: Player, ...text: readonly string[]): string {
		try {
			const translator = LocalizationService.GetTranslatorForLocaleAsync(player.LocaleId);
			return text.map((text) => translator.Translate(game, text)).join("");
		} catch {
			return text.join("");
		}
	}
}
