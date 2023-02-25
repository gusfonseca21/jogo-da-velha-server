function checkResult(tiles) {
  const winningCombinations = [
    ["area1", "area4", "area7"],
    ["area1", "area2", "area3"],
    ["area1", "area5", "area9"],
    ["area2", "area5", "area8"],
    ["area3", "area6", "area9"],
    ["area3", "area5", "area7"],
    ["area4", "area5", "area6"],
    ["area7", "area8", "area9"],
  ];

  for (const combination of winningCombinations) {
    const [tile1, tile2, tile3] = combination;
    if (
      tiles[tile1] &&
      tiles[tile1] === tiles[tile2] &&
      tiles[tile1] === tiles[tile3]
    ) {
      console.log(`${tiles[tile1]} venceu!`);
      return;
    }
  }
  if (Object.values(tiles).every((value) => value !== null)) {
    console.log("empate");
    return;
  }
}

module.exports = { checkResult };
