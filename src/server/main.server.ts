import PlotManager from "shared/plots/PlotManager";
import BuildEvent from "./building/BuilldEvent";
import SharedLoader from "shared/Loader";
import { Workspace } from "@rbxts/services";

// Initializing shared components
SharedLoader.load();

// Initializing client-side components
BuildEvent.initialize();

PlotManager.writePlotData(Workspace, { ownerID: 1234, whitelistedPlayers: [], blacklistedPlayers: [] });
