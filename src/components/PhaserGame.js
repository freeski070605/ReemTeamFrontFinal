import React, { useEffect, useRef } from 'react';
import Phaser from 'phaser';
import GameplayScene from '../phaser/scenes/GameplayScene';

const PhaserGame = ({
  tableId,
  gameState,
  setGameState,
  user,
  socket,
  isSpectator,
  reorderedPlayers,
  reorderedHands,
  reorderedSpreads,
  adjustedCurrentTurn,
  currentPlayerIndex,
  handleCardClick,
  handlePlayerAction,
  handleSpread,
  handleHit,
  handleDrop,
  toggleHitMode,
  hitMode,
  selectedCard,
  actionBlockedMessage,
  setActionBlockedMessage,
  isValidHit
}) => {
  const gameRef = useRef(null);

  useEffect(() => {
    const config = {
      type: Phaser.AUTO,
      width: 1280, // Adjust as needed for your game
      height: 720, // Adjust as needed for your game
      parent: 'phaser-game-container',
      physics: {
        default: 'arcade',
        arcade: {
          gravity: { y: 0 }, // No gravity for a card game
          debug: false
        }
      },
      scene: [GameplayScene]
    };

    if (gameRef.current) {
      gameRef.current.destroy(true);
    }

    const game = new Phaser.Game(config);
    gameRef.current = game;

    // Pass props to the scene
    game.scene.start('GameplayScene', {
      tableId,
      gameState,
      setGameState,
      user,
      socket,
      isSpectator,
      reorderedPlayers,
      reorderedHands,
      reorderedSpreads,
      adjustedCurrentTurn,
      currentPlayerIndex,
      handleCardClick,
      handlePlayerAction,
      handleSpread,
      handleHit,
      handleDrop,
      toggleHitMode,
      hitMode,
      selectedCard,
      actionBlockedMessage,
      setActionBlockedMessage,
      isValidHit
    });

    return () => {
      if (gameRef.current) {
        gameRef.current.destroy(true);
      }
    };
  }, [
    tableId,
    gameState,
    setGameState,
    user,
    socket,
    isSpectator,
    reorderedPlayers,
    reorderedHands,
    reorderedSpreads,
    adjustedCurrentTurn,
    currentPlayerIndex,
    handleCardClick,
    handlePlayerAction,
    handleSpread,
    handleHit,
    handleDrop,
    toggleHitMode,
    hitMode,
    selectedCard,
    actionBlockedMessage,
    setActionBlockedMessage,
    isValidHit
  ]);

  return <div id="phaser-game-container" style={{ width: '100%', height: '100%', overflow: 'hidden' }}></div>;
};

PhaserGame.propTypes = {
  tableId: PropTypes.string.isRequired,
  gameState: PropTypes.object.isRequired,
  setGameState: PropTypes.func.isRequired,
  user: PropTypes.object.isRequired,
  socket: PropTypes.object.isRequired,
  isSpectator: PropTypes.bool.isRequired,
  reorderedPlayers: PropTypes.array.isRequired,
  reorderedHands: PropTypes.array.isRequired,
  reorderedSpreads: PropTypes.array.isRequired,
  adjustedCurrentTurn: PropTypes.number.isRequired,
  currentPlayerIndex: PropTypes.number.isRequired,
  handleCardClick: PropTypes.func.isRequired,
  handlePlayerAction: PropTypes.func.isRequired,
  handleSpread: PropTypes.func.isRequired,
  handleHit: PropTypes.func.isRequired,
  handleDrop: PropTypes.func.isRequired,
  toggleHitMode: PropTypes.func.isRequired,
  hitMode: PropTypes.bool.isRequired,
  selectedCard: PropTypes.number,
  actionBlockedMessage: PropTypes.string.isRequired,
  setActionBlockedMessage: PropTypes.func.isRequired,
  isValidHit: PropTypes.func.isRequired,
};

export default PhaserGame;