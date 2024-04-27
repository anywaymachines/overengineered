import { Players, ReplicatedStorage } from "@rbxts/services";
import { Logger } from "shared/Logger";
import { SharedPlot } from "shared/building/SharedPlot";
import { Component } from "shared/component/Component";
import { ComponentChild } from "shared/component/ComponentChild";
import { InstanceComponent } from "shared/component/InstanceComponent";
import { GameDefinitions } from "shared/data/GameDefinitions";

const logger = new Logger("PlotsFloatingImageController");

export class PlotFloatingImageController extends Component {
	constructor(plot: SharedPlot) {
		super();

		const container = new ComponentChild(this);
		const create = (player: Player) => {
			const gui = ReplicatedStorage.Assets.PlotOwnerGui.Clone();
			gui.UserImage.Image = Players.GetUserThumbnailAsync(
				player.UserId,
				Enum.ThumbnailType.AvatarThumbnail,
				Enum.ThumbnailSize.Size420x420,
			)[0];
			gui.DisplayNameLabel.Text = player.DisplayName;
			gui.UsernameLabel.Text = `@${player.Name}`;
			gui.Parent = plot.instance;
			gui.Adornee = plot.instance.FindFirstChild("BuildingArea") as BasePart;

			let rank = 0;
			try {
				rank = player.GetRankInGroup(GameDefinitions.GROUP);
			} catch {
				logger.error("Unable to get player rank");
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

			return new InstanceComponent(gui);
		};

		this.event.subscribeObservable(plot.ownerId, (owner) => {
			container.clear();

			if (owner !== undefined) {
				container.set(create(Players.GetPlayerByUserId(owner)!));
			}
		});
	}
}
