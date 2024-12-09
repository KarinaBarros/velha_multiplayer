import React, { useEffect, useState, useRef } from "react";
import { database } from "@/firebaseConfig";
import { serverTimestamp, ref, onDisconnect, onValue } from "firebase/database";
import { useFocusEffect } from "expo-router";
import { useUpdate, useGet, usePush, useRemove } from "@/hooks/serverFirebase";

export function usePlayers(path: string, newBoard: any[]) {
    const [gameId, setGameId] = useState<string | null>(null);
    const [player, setPlayer] = useState<string | null>(null);
    let Idgame: boolean | string = false;
    let conectedPlayer: boolean | string = false;
    let keyAdversary: boolean | string = false;
    let adversary: boolean = false;

    interface Game {
        player1: boolean;
        player2: boolean;
        board: boolean | any[];
        gameover: boolean | string;
        turn: boolean | string;
        line: boolean;
        lastActive: object;
    }

    //Função para criar novo jogo ou adicionar o player a um jogo existente
    async function newGame() {
        const data = await useGet(path);
        let gameExists: boolean = false;
        if (data) {

            for (const [id, game] of Object.entries(data)) {
                const gameData = game as Game;
                if (gameData.player1 && !gameData.player2) {
                    await useUpdate(`${path}/${id}`, {
                        player2: true,
                        turn: 'player1',
                        lastActive: serverTimestamp()
                    })
                    setGameId(id);
                    Idgame = id;
                    conectedPlayer = 'player2';
                    keyAdversary = 'player1';
                    setPlayer('player2');
                    gameExists = true;
                    hasAdversary();
                    disconect();
                }
                if (!gameData.player1 && gameData.player2) {
                    await useUpdate(`${path}/${id}`, {
                        player1: true,
                        turn: 'player2',
                        lastActive: serverTimestamp()
                    })
                    setGameId(id);
                    Idgame = id;
                    conectedPlayer = 'player1';
                    keyAdversary = 'player2';
                    setPlayer('player1');
                    gameExists = true;
                    hasAdversary();
                    disconect();
                }
            }
        }
        if (!data || !gameExists) {
            const id = await usePush(path, {
                player1: true,
                player2: false,
                board: newBoard,
                gameover: false,
                turn: false,
                line:false,
                lastActive: serverTimestamp()
            })
            if (id) {
                setGameId(id);
                Idgame = id;
                conectedPlayer = 'player1';
                keyAdversary = 'player2';
                setPlayer('player1');
                hasAdversary();
                disconect();
            }
        }

    }

    useEffect(() => {
        newGame();
    }, []);

    //observar as mudanças do adversario
    function hasAdversary() {
        if (Idgame && keyAdversary && path) {
            const gameRef = ref(database, `${path}/${Idgame}/${keyAdversary}`);
            console.log(path, Idgame, keyAdversary);
            onValue(gameRef, (snapshot) => {
                const data = snapshot.val();
                adversary = data;
                disconect();
            });
        }
    }

    useFocusEffect(
        React.useCallback(() => {
            // Função de retorno chamada quando a tela perde o foco
            return () => {
                console.log("Tela perdeu foco");
                async function offFocus() {
                    console.log('adversario', keyAdversary, adversary);
                    if (typeof conectedPlayer === 'string' && path && Idgame) {
                        if (adversary) {
                            await useUpdate(`${path}/${Idgame}`, {
                                [conectedPlayer]: false,
                                board: newBoard,
                                gameover: false,
                                turn: false,
                                line:false,
                                lastActive: serverTimestamp()
                            })
                        } else {
                            await useRemove(`${path}/${Idgame}`);
                        }
                    }
                }
                offFocus();
            };
        }, [])
    );

    async function disconect() {
        if (typeof conectedPlayer === 'string' && path && Idgame && typeof keyAdversary === 'string') {
            const gameRef = ref(database, `${path}/${Idgame}`);
            console.log(gameRef.toString());
    
            if (adversary) {
                await onDisconnect(gameRef).set({
                    [conectedPlayer]: false,
                    [keyAdversary]:true,
                    board: newBoard,
                    gameover: false,
                    turn: false,
                    line:false,
                    lastActive: serverTimestamp()
                })
            } else {
                await onDisconnect(gameRef).remove();
            }
        }
    }
        return { gameId, player }; 
}