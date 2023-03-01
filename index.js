const { checkResult } = require("./checkResult");

const express = require("express");
const app = express();
const http = require("http");
const { Server } = require("socket.io");
const cors = require("cors");

app.use(cors());

const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: "https://rolezeiros-jogo-da-velha.netlify.app",
    methods: ["GET", "POST"],
  },
});

let connectedPlayers = [];

let playersPlaying = [];

let activePlayer = null;

const tiles = {
  area1: null,
  area2: null,
  area3: null,
  area4: null,
  area5: null,
  area6: null,
  area7: null,
  area8: null,
  area9: null,
};

function resetBoard(socket) {
  Object.keys(tiles).forEach((tile) => {
    tiles[tile] = null;
  });

  socket.emit("update_tiles", tiles);
  socket.broadcast.emit("update_tiles", tiles);
}

io.on("connection", (socket) => {
  console.log(`Usuário conectado: ${socket.id}`);

  socket.on("join", (data) => {
    data.id = socket.id;
    data.gameScore = 0;

    connectedPlayers.push(data);

    socket.emit("set_player", data);
    socket.emit("update_players_list", connectedPlayers);
    socket.broadcast.emit("update_players_list", connectedPlayers);

    activePlayer = connectedPlayers[0];

    socket.emit("set_active_player", activePlayer);
    socket.broadcast.emit("set_active_player", activePlayer);

    if (connectedPlayers.length === 2) {
      playersPlaying.push(
        { ...connectedPlayers[0], roundScore: 0 },
        { ...connectedPlayers[1], roundScore: 0 }
      );
      activePlayer = connectedPlayers[0];

      socket.emit("set_players_playing", playersPlaying);
      socket.broadcast.emit("set_players_playing", playersPlaying);
    }

    // Enviando mensagem de jogador conectado
    const connectedMessage = {
      sender: { name: "Servidor", selectedAvatar: null, id: "1" },
      message: `${data.name} se conectou`,
      date: new Date(),
    };
    socket.broadcast.emit("message_received", connectedMessage);
  });

  socket.on("disconnect", () => {
    let disconnectedPlayer = null;
    connectedPlayers.forEach((connectedPlayer, index) => {
      if (connectedPlayer.id === socket.id) {
        disconnectedPlayer = connectedPlayers.splice(index, 1)[0];
      }
    });

    if (disconnectedPlayer) {
      playersPlaying.forEach((playerPlaying) => {
        if (disconnectedPlayer.id) {
          if (playerPlaying.id === disconnectedPlayer.id) resetBoard(socket);
        }
      });

      // Atualizando os jogadores que estarão jogando
      if (connectedPlayers.length < 2) playersPlaying.length = 0;
      if (connectedPlayers.length >= 2) {
        playersPlaying = [connectedPlayers[0], connectedPlayers[1]];
      }

      // Se o jogador ativo se disconectar, alterar o jogador ativo
      if (disconnectedPlayer.id === activePlayer.id) {
        activePlayer = playersPlaying[0];
      }

      // Enviando mensagem de jogador desconectado
      const disconnectMessage = {
        sender: { name: "Servidor", selectedAvatar: null, id: "1" },
        message: `${disconnectedPlayer.name} se desconectou`,
        date: new Date(),
      };

      socket.broadcast.emit("update_players_list", connectedPlayers);
      socket.broadcast.emit("set_players_playing", playersPlaying);
      socket.broadcast.emit("set_active_player", activePlayer);
      socket.broadcast.emit("message_received", disconnectMessage);
    }
  });

  socket.on("message_sent", (data) => {
    socket.broadcast.emit("message_received", data);
  });

  socket.on("player_input", (clientTiles) => {
    const clientTilesKey = Object.keys(clientTiles)[0];

    if (tiles[clientTilesKey]) return;

    tiles[clientTilesKey] = clientTiles[clientTilesKey];

    socket.broadcast.emit("update_tiles", tiles);

    // Mudar o jogador ativo
    if (activePlayer.id === playersPlaying[0].id) {
      activePlayer = playersPlaying[1];
    } else {
      activePlayer = playersPlaying[0];
    }

    socket.emit("set_active_player", activePlayer);
    socket.broadcast.emit("set_active_player", activePlayer);

    const results = checkResult(
      tiles,
      socket,
      playersPlaying,
      connectedPlayers,
      resetBoard
    );

    if (results) {
      connectedPlayers = results.updatedConnectedPlayers;
      playersPlaying = results.updatedPlayersPlaying;
      activePlayer = results.updatedPlayersPlaying[0];
    }
  });
});

server.listen(3000, () => {
  console.log("Servidor rodando");
});
