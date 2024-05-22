import { Players, ReplicatedStorage, RunService, Workspace } from "@rbxts/services";
import { Gui } from "client/gui/Gui";
import { PlayerDataStorage } from "client/PlayerDataStorage";
import { InstanceComponent } from "shared/component/InstanceComponent";
import { RobloxUnit } from "shared/RobloxUnit";
import { PartUtils } from "shared/utils/PartUtils";
import { VectorUtils } from "shared/utils/VectorUtils";

type BeaconBillboardGui = GuiObject & {
	readonly Title: TextLabel;
	readonly Distance: TextLabel;
	readonly ImageLabel: ImageLabel;
};

export class Beacon extends InstanceComponent<PVInstance> {
	private readonly billboard;

	constructor(part: PVInstance, name: string, config: keyof BeaconsConfiguration) {
		super(part);

		this.billboard = (
			ReplicatedStorage.Assets as unknown as { BeaconBillboardGui: BeaconBillboardGui }
		).BeaconBillboardGui.Clone();

		PartUtils.applyToAllDescendantsOfType("GuiObject", this.billboard, (gui) => {
			gui.ZIndex = -1;
		});

		this.billboard.Position = new UDim2(0, 1, 0, 1);
		this.billboard.Parent = Gui.getUnscaledGameUI();
		this.billboard.Title.Text = name;

		this.event.subscribe(RunService.RenderStepped, () => {
			if (!PlayerDataStorage.config.get().beacons[config]) {
				this.billboard.ImageLabel.ImageTransparency = 1;
				this.billboard.Title.TextTransparency = 1;
				this.billboard.Distance.TextTransparency = 1;
				return;
			}

			const character = Players.LocalPlayer.Character;
			if (!character) return;

			const distance = RobloxUnit.Studs_To_Meters(
				part.GetPivot().Position.sub(character.GetPivot().Position).Magnitude,
			);

			const cutoffDistance = 30;
			const transparencyMultiplier = 0.8;
			const transparency = 1 - math.clamp((distance - cutoffDistance) / 10, 0, 1) * transparencyMultiplier;

			this.billboard.ImageLabel.ImageTransparency = transparency;
			this.billboard.Title.TextTransparency = transparency;
			this.billboard.Distance.TextTransparency = transparency;

			if (transparency >= 1) return;

			let distancestr: string;
			if (distance > 1000) distancestr = `${math.floor(distance / 100) / 10} km`;
			else distancestr = `${math.floor(distance)} m`;

			this.billboard.Distance.Text = distancestr;
			const [screenPos, isVisible] = Workspace.CurrentCamera!.WorldToViewportPoint(part.GetPivot().Position);
			const screenSize = Workspace.CurrentCamera!.ViewportSize;
			const adjustableOffset =
				this.billboard.AbsoluteSize.Y > this.billboard.AbsoluteSize.X
					? this.billboard.AbsoluteSize.Y / 2
					: this.billboard.AbsoluteSize.X / 2;
			let [pos_x, pos_y] = [screenPos.X, screenPos.Y];

			const halfScreenX = screenSize.X / 2;
			const halfScreenY = screenSize.Y / 2;

			if (!isVisible || pos_x > screenSize.X || pos_y > screenSize.Y || pos_x < 0 || pos_y < 0) {
				const vector = new Vector2(pos_x - halfScreenX, pos_y - halfScreenY);
				const normalizedVector = VectorUtils.normalizeVector2(vector)
					.mul(new Vector2(screenSize.X, screenSize.Y))
					.add(new Vector2(halfScreenX, halfScreenY));

				[pos_x, pos_y] = [normalizedVector.X, normalizedVector.Y];

				if (screenPos.Z < 0) {
					pos_x = screenSize.X - pos_x;
					pos_y = screenSize.Y - pos_y;
				}

				const d = halfScreenX / halfScreenY;
				let vec = new Vector2(pos_x, pos_y).sub(new Vector2(halfScreenX, halfScreenY));
				vec = new Vector2(math.abs(vec.X), math.abs(vec.Y))
					.sub(new Vector2(halfScreenX, halfScreenY))
					.div(new Vector2(d, 1));
				vec = new Vector2(math.abs(vec.X), math.abs(vec.Y));

				const newTransparency = 1 - (1 - vec.Magnitude / halfScreenX) * (1 - transparency);
				this.billboard.ImageLabel.ImageTransparency = newTransparency;
				this.billboard.Title.TextTransparency = newTransparency;
				this.billboard.Distance.TextTransparency = newTransparency;

				pos_x = math.clamp(pos_x, adjustableOffset, screenSize.X - adjustableOffset);
				pos_y = math.clamp(pos_y, adjustableOffset, screenSize.Y - adjustableOffset);
			}

			this.billboard.Position = new UDim2(0, pos_x, 0, pos_y);
		});
	}

	enable(): void {
		super.enable();
		this.billboard.Visible = true;
	}
	disable(): void {
		super.disable();
		this.billboard.Visible = false;
	}
}
