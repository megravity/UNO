import { useContext, useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { MyContext } from "../context/context";
import { socket } from "../socket.js";
import deckCard from "../assets/unoCards";
import calculateNextTurn from "../utilis/calculateNextTurn";
import Card from "./Card";
import setBgColor from "../utilis/setBgColor";
import Modal from "./Modal";
const GameRoom = () => {
    const { id } = useParams();
    const [showPopup, setShowPopup] = useState(false);

    const { user, room, rooms, setRoom, color, winner, setWinner } = useContext(MyContext);

    const drawCard = (numOfCards) => {
        return room.gameData.drawPile.splice(0, numOfCards);
    };

    const startGame = () => {
        setShowPopup(false);
        socket.emit("start_game", {
            roomId: room._id,
        });
    };

    const leaveRoom = () => {
        socket.emit("leave_room", { userId: user._id, roomId: room });
    };

    useEffect(() => {
        setRoom(rooms.find((item) => item._id === id));
    }, [rooms, id]);

    const drawPileHandler = () => {
        if (room.players[room.gameData.turn]._id.toString() !== user._id.toString()) {
            alert("Not your turn");
        } else {
            const drawnCards = drawCard(1);
            const allPlayerCards = room.gameData.allPlayerCards.map((player) => {
                if (player.userId === user._id) {
                    player.cards.push(...drawnCards);
                }
                return player;
            });

            socket.emit("update_game", {
                ...room,
                gameData: {
                    ...room.gameData,
                    allPlayerCards,
                    turn: calculateNextTurn(false, false, room.gameData.turn, room.players.length),
                },
            });
        }
    };

    const cardHandler = (card) => {
        if (room.players[room.gameData.turn]._id.toString() !== user._id.toString()) {
            console.log("Not your turn");
        } else {
            if (
                card.color === room.gameData.discardPile[0].color ||
                card.number === room.gameData.discardPile[0].number ||
                card.number === ""
            ) {
                if (card.number === "" || card.number === "D4") {
                    setShowPopup(true);
                }

                const player = room.gameData.allPlayerCards.find(
                    (item) => item.userId === user._id
                );
                let allPlayerCards = room.gameData.allPlayerCards;

                if (!(player.cards.length === 4 && !player.isUno)) {
                    const cardIndex = player.cards.indexOf(card);
                    player.cards.splice(cardIndex, 1);
                    room.gameData.discardPile.unshift(card);
                } else {
                    alert("You didn't say UNO!");

                    const drawnCards = drawCard(2);
                    allPlayerCards = room.gameData.allPlayerCards.map((player) => {
                        if (player.userId === user._id) {
                            player.cards.push(...drawnCards);
                        }
                        return player;
                    });
                }

                const cardIndex = player.cards.indexOf(card);
                player.cards.splice(cardIndex, 1);

                room.gameData.discardPile.unshift(card);

                socket.emit("update_game", {
                    ...room,
                    gameData: {
                        ...room.gameData,
                        turn: calculateNextTurn(
                            card.number === "_" ? true : false,
                            card.number === "skip" ? true : false,
                            room.gameData.turn,
                            room.players.length
                        ),
                        allPlayerCards,
                    },
                });
            } else {
                alert("invalid card");
            }
        }
    };

    const checkUno = () => {
        const player = room.gameData.allPlayerCards.find((item) => item.userId === user._id);
        if (player.cards.length === 2) {
            player.isUno = true;
        }
    };
    console.log(room?.gameData.allPlayerCards, "allPlayerCards");
    console.log(room?.players, "players");

    return (
        <div
            style={{
                backgroundColor: room?.bgColor ? room?.bgColor : "#f5f5f5",
                color: room?.bgColor === "#010101" ? "white" : "black",
            }}
        >
            {room && (
                <div>
                    {room.isStarted ? (
                        <div>
                            {room.gameData.allPlayerCards.map((player) => (
                                <h1 key={player?.userId}>
                                    {player?.name} : {player?.cards?.length}{" "}
                                </h1>
                            ))}
                        </div>
                    ) : (
                        <div>
                            {room.players.map((player) => {
                                return <h1 key={player?._id}>{player?.name}</h1>;
                            })}
                        </div>
                    )}
                    <div>
                        {room?.userId?.toString() === user._id.toString() ? (
                            <button
                                disabled={room.players.length <= 1}
                                onClick={startGame}
                                className="border-slate-950 border-2 p-1 rounded"
                            >
                                start game
                            </button>
                        ) : (
                            !room.players.includes(room.userId.toString()) &&
                            room.players[0]._id === user._id && (
                                <button onClick={startGame}>Start Game with First Player</button>
                            )
                        )}
                        <div className="flex">
                            <div hidden={!room.isStarted}>
                                <div>
                                    <h3>Discard Pile</h3>
                                    {room.gameData.discardPile && (
                                        <div
                                            className={`flex justify-center w-[300px] ${setBgColor(
                                                room.gameData.discardPile[0]?.color
                                            )}`}
                                        >
                                            <Card
                                                color={room.gameData.discardPile[0]?.color}
                                                number={room.gameData.discardPile[0]?.number}
                                            />
                                        </div>
                                    )}
                                </div>
                                <div>
                                    <h3>Draw Pile</h3>
                                    <img
                                        className="w-[200px]"
                                        src={deckCard}
                                        onClick={drawPileHandler}
                                    />
                                </div>

                                {showPopup && (
                                    <Modal
                                        setShowPopup={setShowPopup}
                                        skipTurn={skipTurn}
                                        reverseTurn={reverseTurn}
                                        drawCard={drawCard}
                                    />
                                )}
                                <h3>player cards</h3>
                                {room.gameData.allPlayerCards
                                    .find((item) => item.userId === user._id)
                                    ?.cards.map((card, i) => (
                                        <div
                                            onClick={() => cardHandler(card)}
                                            className="inline-block"
                                            key={card.number + i}
                                        >
                                            <Card color={card.color} number={card.number} />
                                        </div>
                                    ))}

                                <button
                                    // disabled={playerCards?.length !== 6}
                                    onClick={checkUno}
                                    className="border-slate-950 border-2 p-1 rounded"
                                >
                                    UNO
                                </button>
                            </div>
                        </div>

                        <button
                            className="block border-slate-950 border-2 p-1 rounded"
                            onClick={leaveRoom}
                        >
                            Leave Room
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default GameRoom;
