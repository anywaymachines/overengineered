import { Players, ReplicatedStorage, Workspace } from "@rbxts/services";
import ComponentBase from "client/component/ComponentBase";
import Signals from "client/event/Signals";
import Gui from "client/gui/Gui";
import SharedPlots from "shared/building/SharedPlots";

export default class CenterOfMassController extends ComponentBase {
	private readonly viewportFrame;
	private renderedBalls: Model[] = [];

	constructor() {
		super();

		this.viewportFrame = new Instance("ViewportFrame");
		this.viewportFrame.Name = "WireViewportFrame";
		this.viewportFrame.Size = UDim2.fromScale(1, 1);
		this.viewportFrame.CurrentCamera = Workspace.CurrentCamera;
		this.viewportFrame.Transparency = 1;
		this.viewportFrame.Parent = Gui.getGameUI();
		this.viewportFrame.Ambient = Color3.fromRGB(255, 255, 255);
		this.viewportFrame.LightColor = Color3.fromRGB(255, 255, 255);
		this.viewportFrame.ZIndex = -1000;

		const update = () => {
			const blocks = SharedPlots.getPlotByOwnerID(Players.LocalPlayer.UserId).Blocks.GetChildren(undefined);
			const pos = this.calculateCentersOfMass(blocks);

			if (pos.size() > this.renderedBalls.size()) {
				for (let i = 0; i < pos.size() - this.renderedBalls.size(); i++)
					this.renderedBalls.push(ReplicatedStorage.Assets.CenterOfMass.Clone());
			}

			if (pos.size() < this.renderedBalls.size()) {
				const size = this.renderedBalls.size();
				for (let i = size; i > size - pos.size(); i--) {
					this.renderedBalls[i].Destroy();
					this.renderedBalls.remove(i);
				}
			}

			for (let i = 0; i < pos.size(); i++) {
				const ball = this.renderedBalls[i];
				ball.Parent = this.viewportFrame;
				ball.PivotTo(new CFrame(pos[i]));
			}
		};

		this.event.subscribe(Signals.BLOCKS.BLOCKS_MOVED, update);
		this.event.subscribe(Signals.BLOCKS.BLOCK_ADDED, update);
		this.event.subscribe(Signals.BLOCKS.BLOCK_REMOVED, update);
		this.event.onEnable(update);
		this.event.onDisable(() => {
			this.renderedBalls.forEach((element) => {
				element.Destroy();
			});
			this.renderedBalls.clear();
		});
	}

	private calculateCentersOfMass(blocks: readonly BlockModel[]) {
		const results: Vector3[] = [];
		const ass: Set<BasePart> = new Set<BasePart>();
		for (const block of blocks) {
			for (const part of block.GetChildren().filter((c) => c.IsA("BasePart")) as unknown as readonly BasePart[]) {
				const root = part.AssemblyRootPart;
				if (!root) continue;
				if (ass.has(root)) continue;
				results.push(root.AssemblyCenterOfMass);
				ass.add(root);
			}
		}
		return results;
	}
}
