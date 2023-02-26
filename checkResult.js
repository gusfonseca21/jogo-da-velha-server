function checkResult(
  tiles,
  socket,
  playersPlaying,
  connectedPlayers,
  resetBoard
) {
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
      const winner = tiles[tile1];
      socket.emit("end_of_round", { isDraw: false, winner });
      socket.broadcast.emit("end_of_round", {
        isDraw: false,
        winner,
      });
      let updatedGameScore = connectedPlayers;
      const updatedRoundScore = playersPlaying.map((playerPlaying) => {
        if (playerPlaying.id === winner) {
          playerPlaying.roundScore++;
          if (playerPlaying.roundScore === 3) {
            playerPlaying.roundScore = 0;
            playerPlaying.gameScore++;

            updatedGameScore = connectedPlayers.map((player) => {
              if (player.id === playerPlaying.id) {
                player.gameScore++;
                return player;
              }
              return player;
            });
          }
          return playerPlaying;
        }

        resetBoard(socket);
        return playerPlaying;
      });

      socket.emit("set_players_playing", updatedRoundScore);
      socket.broadcast.emit("set_players_playing", updatedRoundScore);
      socket.emit("update_players_list", updatedGameScore);
      socket.broadcast.emit("update_players_list", updatedGameScore);

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
