function updatePlayersPlaying(socket, updatedRoundScore, connectedPlayers) {
  // 1: atualizar a ordem de connectedPlayers, adicionando gameScore ao vencedor
  const loser = updatedRoundScore.filter(
    (player) => player.roundScore !== 3
  )[0];
  const winner = updatedRoundScore.filter(
    (player) => player.roundScore === 3
  )[0];

  let updatedConnectedPlayers = connectedPlayers;

  updatedConnectedPlayers.forEach((player, index) => {
    if (player.id === loser.id) {
      const removedPlayer = updatedConnectedPlayers.splice(index, 1)[0];
      updatedConnectedPlayers.push(removedPlayer);
    }
  });

  updatedConnectedPlayers.forEach((player) => {
    if (player.id === winner.id) {
      player.gameScore++;
    }
  });

  socket.emit("update_players_list", updatedConnectedPlayers);
  socket.broadcast.emit("update_players_list", updatedConnectedPlayers);

  // 2: atualizar playersPlaying e zerar o roundScore
  let updatedPlayersPlaying = [];

  updatedConnectedPlayers.forEach((player, index) => {
    if (index < 2) {
      updatedPlayersPlaying.push({ ...player, roundScore: 0 });
    }
  });

  socket.emit("set_players_playing", updatedPlayersPlaying);
  socket.broadcast.emit("set_players_playing", updatedPlayersPlaying);

  // 3: setar o player ativo
  socket.emit("set_active_player", updatedPlayersPlaying[0]);
  socket.broadcast.emit("set_active_player", updatedPlayersPlaying[0]);

  const results = {
    updatedConnectedPlayers,
    updatedPlayersPlaying,
  };

  return results;
}

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

      const updatedRoundScore = playersPlaying.map((playerPlaying) => {
        if (playerPlaying.id === winner) {
          playerPlaying.roundScore++;
          socket.emit("end_of_round", { isDraw: false, winner });
          socket.broadcast.emit("end_of_round", {
            isDraw: false,
            winner,
          });
          return playerPlaying;
        }

        resetBoard(socket);
        return playerPlaying;
      });

      const didSomeoneWon = playersPlaying.reduce((acc, player) => {
        if (player.roundScore === 3) {
          acc = true;
        }
        return acc;
      }, false);

      if (didSomeoneWon) {
        const results = updatePlayersPlaying(
          socket,
          updatedRoundScore,
          connectedPlayers
        );

        socket.emit("end_of_round", {
          isDraw: false,
          winner,
          gameWinner: true,
        });
        socket.broadcast.emit("end_of_round", {
          isDraw: false,
          winner,
          gameWinner: true,
        });
        return results;
      } else {
        socket.emit("set_players_playing", updatedRoundScore);
        socket.broadcast.emit("set_players_playing", updatedRoundScore);
      }
    }
  }
  if (Object.values(tiles).every((value) => value !== null)) {
    socket.emit("end_of_round", { isDraw: true, winner: null });
    socket.broadcast.emit("end_of_round", { isDraw: true, winner: null });
    resetBoard(socket);
    return null;
  }
}

module.exports = { checkResult };
