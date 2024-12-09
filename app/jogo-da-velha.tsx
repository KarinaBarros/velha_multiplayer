import React, { useEffect, useState } from "react";
import { usePlayers } from "@/hooks/usePlayers";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { database } from "@/firebaseConfig";
import { ref, onValue, serverTimestamp, off } from "firebase/database";
import { useUpdate } from "@/hooks/serverFirebase";

export default function JogoDaVelha() {
    const newBoard = ["", "", "", "", "", "", "", "", ""];
    const path = 'velha';

    const { gameId, player } = usePlayers(path, newBoard);
    type StyleKeys = 'l0' | 'l1' | 'l2' | 'l3' | 'l4' | 'l5' | 'l6' | 'l7';

    interface Game {
        player1: boolean;
        player2: boolean;
        board: boolean | any[];
        gameover: boolean | string;
        turn: boolean | string;
        line: boolean | StyleKeys;
        lastActive: object;
    }

    const [gameData, setGameData] = useState<Game | null>(null);
    const [count, setCount] = useState(5);
    const [message, setMessage] = useState('Aguardando um adversário');
    const [colorMessage, setColorMessage] = useState('red');
    const [disabled, setDisabled] = useState(true);

    //observar as mudanças do game
    useEffect(() => {
        if (gameId && player) {
            const gameRef = ref(database, `velha/${gameId}`);
            onValue(gameRef, (snapshot) => {
                const data = snapshot.val();

                if (data) {
                    setGameData(data); // Atualiza o estado com os dados do jogo
                }
            });
        }
        console.log(gameData);
    }, [gameId, player]);

    //Alternar entre os jogadores e gameover
    useEffect(() => {
        if(gameData && !gameData.turn){
            setMessage('Aguardando um adversário');
            setColorMessage('red');
        }
        if (gameData && gameData.turn && !gameData.gameover) {
            if (gameData.turn === player) {
                setMessage('Faça sua jogada');
                setColorMessage('green');
                setDisabled(false);
            } else if (gameData.turn !== player) {
                setMessage('Jogada do adversário');
                setColorMessage('red');
                setDisabled(true);
            }
            setCount(5);
        }
        if (gameData && gameData.turn && gameData.gameover){
            setDisabled(true);
            if(gameData.gameover === player){
                setMessage('Você ganhou!');
                setColorMessage('green');
            }else if(gameData.gameover === 'velha'){
                setMessage('Jogo deu velha!');
                setColorMessage('red');
            }else{
                setMessage('Você perdeu!');
                setColorMessage('red');
            }
        }

    }, [gameData, player])

    //Função para clique no tabuleiro
    async function playAction(indice: number) {
        setDisabled(true);
        if (player === null) {
            return; // Não faz nada se o player for null
        }
        let symbol;
        let turn;
        let array: any = gameData?.board;

        if (player === 'player1') {
            turn = 'player2';
            symbol = 'x'
        }
        if (player === 'player2') {
            turn = 'player1'
            symbol = 'o'
        }
        //Definir array para atualizar ao inves de consultar ja que gamedata.board pode não estar atualizada no momento da correção
        if (gameData && Array.isArray(gameData.board)) {
            array[indice] = symbol;
        }
        console.log(array);

        await useUpdate(`velha/${gameId}/board/`, { [indice]: symbol });
        
        //Verificar se houve ganhador
        let gameOver: boolean | string = false;
        const combinations = [[0, 1, 2], [3, 4, 5], [6, 7, 8],
        [0, 3, 6], [1, 4, 7], [2, 5, 8],
        [0, 4, 8], [2, 4, 6]];
        if (gameData && player && gameId && Array.isArray(array)) {
            for (const [index, combination] of combinations.entries()) {
                if (array[combination[0]] && array[combination[1]] && array[combination[2]] &&
                    array[combination[0]] === array[combination[1]] &&
                    array[combination[0]] === array[combination[2]]
                ) {
                    await useUpdate(`velha/${gameId}`, {
                        gameover: player,
                        turn: player,
                        line: `l${index}`,
                        lastActive: serverTimestamp(),
                    })
                    gameOver = true;
                    break;
                }
            }
        }
        //Verificar se deu velha
        if(array.every((s: string) => s !== "") && !gameOver){
            await useUpdate(`velha/${gameId}`, {
                gameover: 'velha',
                lastActive: serverTimestamp(),
            })
        }
        if(!gameOver || typeof gameOver === 'string' && gameOver === 'velha'){
            await useUpdate(`velha/${gameId}`, {
                turn: turn,
                lastActive: serverTimestamp(),
            });
        }

    }

    //Atualizar o gameover para false após a contagem regressiva
    async function gameOverFalse() {
        if (gameId && gameData) {
            await useUpdate(`velha/${gameId}`, {
                gameover: false,
                line:false,
                board: newBoard,
                lastActive: serverTimestamp()
            })
        }
    }

    // Lógica de contagem regressiva
    useEffect(() => {
        let timer: NodeJS.Timeout | null = null;

        if (gameData?.gameover && count > 0) {
            timer = setTimeout(() => {
                setCount((prev) => prev - 1);
            }, 1000);
        }

        if (gameData?.gameover && count === 0) {
            gameOverFalse();
        }

        return () => {
            if (timer) {
                clearTimeout(timer); // Limpa o timeout ao desmontar ou reiniciar
            }
        };
    }, [gameData, count]);

    return (
        <View style={styles.container}>
            <Text style={styles.titulo}>Jogo da velha</Text>
            <Text style={[styles.message, { color: colorMessage }]}>{message}</Text>

            {gameData?.turn && (
                <View style={styles.game}>
                    {typeof gameData?.line === 'string' && (
                        <View style={[styles.line, styles[gameData.line]]}></View>
                    )}
                    {Array.isArray(gameData?.board) && (gameData.board.map((cedula, index) => (
                        <TouchableOpacity style={styles.cedula} key={index} onPress={() => playAction(index)} disabled={cedula !== '' ? true : disabled}>
                            <Text style={{ color: cedula === 'x' ? 'red' : cedula === 'o' ? 'green' : 'black', fontSize: 50 }}>{cedula}</Text>
                        </TouchableOpacity>
                    )))}
                </View>
            )}
            {gameData?.gameover && (
                <Text style={styles.titulo}>Novo jogo em: {count}</Text>
            )}
        </View>
    )

}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: 'black',
        alignItems: 'center'
    },
    titulo: {
        marginTop: 40,
        textAlign: 'center',
        fontSize: 20,
        color: 'white'
    },
    message: {
        marginTop: 20,
        textAlign: 'center',
        fontSize: 20,
    },
    game: {
        marginTop: 30,
        width: 280,
        height: 280,
        backgroundColor: 'red',
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'space-between',

    },
    cedula: {
        width: 90,
        height: 90,
        backgroundColor: 'white',
        marginBottom: 5,
        justifyContent: 'center',
        alignItems: 'center',
    },
    line: {
        backgroundColor: 'black',
        height: 3,
        position: 'absolute',
        zIndex: 10
    },
    l0:{
        width: 260,
        top: 50,
        left: 10
    },
    l1:{
        width: 260,
        top: 145,
        left: 10
    },
    l2:{
        width: 260,
        top: 240,
        left:10
    },
    l3:{
        width: 260,
        transform: [{ rotate: '90deg' }],
        top: 140,
        left: -85
    },
    l4:{
        width: 260,
        transform: [{ rotate: '90deg' }],
        top: 140,
        left: 10
    },
    l5:{
        width: 260,
        transform: [{ rotate: '90deg' }],
        top: 140,
        left: 105
    },
    l6:{
        transform: [{ rotate: '45deg' }],
        top: 140,
        left: -47.5,
        width: 376
    },
    l7:{
        transform: [{ rotate: '-45deg' }],
        top: 140,
        left: -47.5,
        width: 376
    }
})
