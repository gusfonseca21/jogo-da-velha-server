function checkResult(tiles, socket, playersPlaying) {
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
      socket.emit("end_of_round", { isDraw: false, winner: tiles[tile1] });
      socket.broadcast.emit("end_of_round", {
        isDraw: false,
        winner: tiles[tile1],
      });
      const updatedRoundScore = playersPlaying.map((playerPlaying) => {
        if (playerPlaying.id === tiles[tile1]) {
          playerPlaying.roundScore++;
          return playerPlaying;
        }
        return playerPlaying;
      });

      socket.emit("set_players_playing", updatedRoundScore);
      socket.broadcast.emit("set_players_playing", updatedRoundScore);

      return updatedRoundScore;
    }
  }
  if (Object.values(tiles).every((value) => value !== null)) {
    console.log("empate");
    socket.emit("end_of_round", { isDraw: true, winner: null });
    socket.broadcast.emit("end_of_round", { isDraw: true, winner: null });
    return null;
  }
}

module.exports = { checkResult };
