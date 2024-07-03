import { Workspace } from "@rbxts/services";
import { SharedPlot } from "shared/building/SharedPlot";

Workspace.WaitForChild("Plots");

const count = Workspace.Plots.GetAttribute("count") as number | undefined;
if (Workspace.Plots.GetChildren().size() !== count) {
	print(
		`!! Target plot count ${count} is not equal to loaded plot count ${Workspace.Plots.GetChildren().size()}, waiting...`,
	);
}
while (Workspace.Plots.GetChildren().size() !== count) {
	task.wait();
}
for (const plot of Workspace.Plots.GetChildren()) {
	plot.WaitForChild("BuildingArea");
}

/** Reading the plots data */
export class SharedPlots {
	static initialize() {
		const plots: readonly SharedPlot[] = (Workspace.Plots.GetChildren() as unknown as PlotModel[])
			.map((p) => new SharedPlot(p).with((c) => c.enable()))
			.sort((left, right) => left.instance.Name < right.instance.Name);
		const plotComponents: ReadonlyMap<PlotModel, SharedPlot> = new Map(plots.map((p) => [p.instance, p]));

		return new SharedPlots(plots, plotComponents);
	}

	constructor(
		readonly plots: readonly SharedPlot[],
		private readonly plotComponents: ReadonlyMap<PlotModel, SharedPlot>,
	) {}

	waitForPlot(userid: number) {
		while (!this.tryGetPlotByOwnerID(userid)) {
			task.wait(0.2);
		}

		return this.getPlotComponentByOwnerID(userid);
	}

	/** Checks if player is allowed to build on the prodived plot */
	isBuildingAllowed(plot: PlotModel, player: Player): boolean {
		return this.plotComponents.get(plot)!.isBuildingAllowed(player);
	}

	/** Returns the player owned plot, if exists */
	tryGetPlotByOwnerID(ownerID: number): SharedPlot | undefined {
		for (const plot of this.plots) {
			if (plot.ownerId.get() === ownerID) {
				return plot;
			}
		}

		return undefined;
	}

	/** Returns the plot component by the plot model */
	getPlotComponent(plot: PlotModel): SharedPlot {
		return this.plotComponents.get(plot)!;
	}

	/** Returns the player owned plot */
	getPlotComponentByOwnerID(ownerID: number): SharedPlot {
		const plot = this.tryGetPlotByOwnerID(ownerID);
		if (!plot) throw `Player ${ownerID} does not have a plot`;

		return plot;
	}

	/** Returns the player owned plot */
	getPlotByOwnerID(ownerID: number): PlotModel {
		return this.getPlotComponentByOwnerID(ownerID).instance;
	}
}
