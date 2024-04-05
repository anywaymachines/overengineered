import { Players, ReplicatedStorage } from "@rbxts/services";
import { Logger } from "shared/Logger";
import { GameDefinitions } from "shared/data/GameDefinitions";

Players.PlayerAdded.Connect((player) => {
	player.CharacterAdded.Connect((character) => {
		if (!player.HasAppearanceLoaded) player.CharacterAppearanceLoaded.Wait();

		task.wait(0.1);

		const head = character.WaitForChild("Head") as BasePart;

		const gui = ReplicatedStorage.Assets.UsernameGui.Clone();

		gui.DisplaynameLabel.Text = player.DisplayName;
		gui.UsernameLabel.Text = `@${player.Name}`;
		gui.Adornee = head;
		gui.Parent = head;
		gui.PlayerToHideFrom = player;

		let rank = 0;
		try {
			rank = player.GetRankInGroup(GameDefinitions.GROUP);
		} catch {
			Logger.err("Unable to get player rank");
		}
		const rankData = GameDefinitions.RANKS[rank];
		if (rankData) {
			gui.RankLabel.Text = rankData.name;
			if (rankData.rainbow) {
				spawn(() => {
					while (gui && gui.FindFirstChild("RankLabel")) {
						const t = 5;
						const hue = (tick() % t) / t;
						const colorrr = Color3.fromHSV(hue, 1, 1);
						gui.RankLabel.TextColor3 = colorrr;
						task.wait();
					}
				});
			} else if (rankData.color) {
				gui.RankLabel.TextColor3 = rankData.color;
			}
		}
	});
});
