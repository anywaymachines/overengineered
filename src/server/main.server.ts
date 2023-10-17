import BuildEvent from "./building/BuilldEvent";
import SharedLoader from "shared/Loader";

// Initializing shared components
SharedLoader.load();

// Initializing client-side components
BuildEvent.initialize();
