export default class WorldController {
	static seed = 0;
	static size = new Vector3(100, 100, 100); // Size of the terrain to generate

	static generate() {
		// for (let x = 1; x < this.size.X; x++) {
		// 	for (let z = 1; z < this.size.Z; z++) {
		// 		// Use Perlin noise to generate a height value
		// 		const y = math.noise(x / 10, z / 10) * 15;
		// 		const cellPosition = new Vector3(x * 5, y, z * 5);
		// 		let material: Enum.Material = Enum.Material.Grass;
		// 		if (y < 3) {
		// 			material = Enum.Material.Sand;
		// 		}
		// 		Workspace.Terrain.FillBall(cellPosition, 2, material);
		// 	}
		// }
	}
}
