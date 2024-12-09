import React, { useEffect } from 'react';
import { View, StyleSheet, Text, Image } from 'react-native';
import { Link } from 'expo-router';



export default function HomeScreen() {

  return (
    <View style={styles.container}>
      <Text style={styles.titulo}>Jogos Clássicos</Text>
      <Link href='/jogo-da-velha' style={styles.link}>
        <Image source={require('../assets/images/velha.png')} style={styles.image}></Image>
        Jogo da velha
      </Link>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'black',
    paddingHorizontal: 20
  },
  titulo: {
    marginTop: 40,
    marginBottom: 40,
    textAlign: 'center',
    fontSize: 24,
    color: 'white'
  },
  link: {
    flex:1,
    width: 120,
    fontSize: 16,
    color: 'white',
    textAlign: 'center'
  },
  image: {
    width: '100%',
    height: 120,
  }
})

