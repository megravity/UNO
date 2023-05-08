import express from "express";
import dotenv from "dotenv";
import mongoose from "mongoose";
import cors from "cors";
import { Server } from "socket.io";
import http from "http";
import userRouter from "./routes/user.js";
import roomRouter from "./routes/gameRoom.js";
import { errorHandler } from "./middlewares/errorHandler.js";
import GameRoom from "./models/gameRoomSchema.js";
dotenv.config();
const app = express();
const server = http.createServer(app);
const io = new Server(server, {
    cors: { origin: "http://localhost:5173" },
});

app.use(express.json());
app.use(cors({ origin: "http://localhost:5173", exposedHeaders: ["token"] }));
app.use(errorHandler);

app.use("/users", userRouter);
app.use("/rooms", roomRouter);
mongoose
    .connect(
        process.env.URI,
        { useNewUrlParser: true, useUnifiedTopology: true },

        { useNewUrlParser: true, useUnifiedTopology: true }
    )
    .then(() => console.log("Database connected! "))
    .catch((err) => console.log("Database is not connected! ", err.message));

io.on("connection", (socket) => {
    console.log(`${socket.id} connected`);

    socket.on("createRoom", async ({ roomName, password, player }) => {
        const newRoom = await GameRoom.create({ roomName, password, players: [player._id] });
        console.log(newRoom);
        socket.join(newRoom._id);
        socket.emit("room_created", newRoom._id);
        socket.emit("room_data", newRoom);
    });

    socket.on("join_room", async (roomID, playerID) => {
        socket.join(roomID);
        let room;
        const foundRoom = await GameRoom.findById(roomID);
        if (!foundRoom.players.includes(playerID)) {
            room = await GameRoom.findByIdAndUpdate(
                roomID,
                {
                    $push: { players: playerID },
                },
                { new: true }
            );
        } else {
            room = foundRoom;
        }
        socket.emit("room_data", room);
    });

    socket.on("leave_room", async (roomID, playerID) => {
        await GameRoom.findByIdAndUpdate(
            roomID,
            {
                $pull: { players: playerID },
            },
            { new: true }
        );
    });

    socket.on("initGameState", (GameState, room) => {
        console.log(GameState, room);
        //socket.to(room).emit("initialData", GameState);
        io.in(room).emit("initialData", GameState);
    });
});

server.listen(8000, () => console.log(`The server is listening on port ${process.env.PORT}`));
