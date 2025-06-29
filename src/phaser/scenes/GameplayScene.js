import Phaser from 'phaser';
import { INITIAL_DECK } from '../../components/gameConstants';

class GameplayScene extends Phaser.Scene {
  constructor() {
    super('GameplayScene');
    this.cardSprites = new Map(); // To keep track of card Phaser.GameObjects.Image instances
    this.playerHandContainers = new Map(); // To keep track of player hand containers
    this.playerSpreadContainers = new Map(); // To keep track of player spread containers
    this.deckSprite = null;
    this.discardPileSprite = null;
    this.actionBlockedText = null;
    this.hitModeMessage = null;
  }

  init(data) {
    this.reactProps = data;
    console.log('GameplayScene initialized with props:', this.reactProps);
  }

  preload() {
    this.load.setBaseURL(process.env.PUBLIC_URL);
    this.load.image('card_back', 'assets/cards/back.png');

    INITIAL_DECK.forEach(card => {
      const filename = `${card.rank}_of_${card.suit}.png`.toLowerCase();
      this.load.image(filename, `assets/cards/${filename}`);
    });
  }

  create() {
    // Set up background
    this.cameras.main.setBackgroundColor('#282c34'); // Dark background

    // Create a graphics object for the table felt
    const tableFelt = this.add.graphics();
    tableFelt.fillStyle(0x2e7d32, 1); // Dark green color
    tableFelt.fillCircle(this.sys.game.config.width / 2, this.sys.game.config.height / 2, 300); // Large circle for the table

    this.add.text(this.sys.game.config.width / 2, 50, 'Phaser Gameplay Scene', { fontSize: '32px', fill: '#fff' }).setOrigin(0.5);

    this.actionBlockedText = this.add.text(this.sys.game.config.width / 2, 100, '', { fontSize: '24px', fill: '#ff0000', backgroundColor: '#330000', padding: { x: 10, y: 5 } }).setOrigin(0.5).setDepth(100).setVisible(false);
    this.hitModeMessage = this.add.text(this.sys.game.config.width / 2, 150, '', { fontSize: '24px', fill: '#000', backgroundColor: '#FFD700', padding: { x: 10, y: 5 } }).setOrigin(0.5).setDepth(100).setVisible(false);

    this.renderGameState(this.reactProps.gameState);
  }

  update() {
    // Update action blocked message visibility
    if (this.reactProps.actionBlockedMessage && !this.actionBlockedText.visible) {
      this.actionBlockedText.setText(this.reactProps.actionBlockedMessage).setVisible(true);
      this.time.delayedCall(2000, () => {
        this.actionBlockedText.setVisible(false);
        this.reactProps.setActionBlockedMessage(''); // Clear message in React state
      });
    }

    // Update hit mode message visibility
    if (this.reactProps.hitMode && !this.hitModeMessage.visible) {
      const message = this.reactProps.selectedCard !== null
        ? "Now click on a spread to hit"
        : "Select a card from your hand to hit with";
      this.hitModeMessage.setText(message).setVisible(true);
    } else if (!this.reactProps.hitMode && this.hitModeMessage.visible) {
      this.hitModeMessage.setVisible(false);
    }

    // Re-render game state if it has changed
    if (this.lastGameState !== this.reactProps.gameState) {
      this.renderGameState(this.reactProps.gameState);
      this.lastGameState = this.reactProps.gameState;
    }
  }

  renderGameState(gameState) {
    if (!gameState || !gameState.players) {
      console.warn('Phaser: Game state not available for rendering.');
      return;
    }

    // Clear existing cards and containers
    this.cardSprites.forEach(sprite => sprite.destroy());
    this.cardSprites.clear();
    this.playerHandContainers.forEach(container => container.destroy());
    this.playerHandContainers.clear();
    this.playerSpreadContainers.forEach(container => container.destroy());
    this.playerSpreadContainers.clear();
    if (this.deckSprite) this.deckSprite.destroy();
    if (this.discardPileSprite) this.discardPileSprite.destroy();

    const {
      reorderedPlayers,
      reorderedHands,
      reorderedSpreads,
      adjustedCurrentTurn,
      isSpectator,
      deck,
      discardPile,
      handleCardClick,
      handlePlayerAction,
      handleSpread,
      handleHit,
      toggleHitMode,
      hitMode,
      selectedCard,
      isValidHit
    } = this.reactProps;

    const centerX = this.sys.game.config.width / 2;
    const centerY = this.sys.game.config.height / 2;
    const cardWidth = 70;
    const cardHeight = 98;
    const cardSpacing = 10;

    // Render Deck
    if (deck && deck.length > 0) {
      this.deckSprite = this.add.image(centerX - 100, centerY, 'card_back')
        .setScale(cardWidth / this.textures.get('card_back').source[0].width, cardHeight / this.textures.get('card_back').source[0].height)
        .setInteractive();
      this.deckSprite.on('pointerdown', () => {
        if (adjustedCurrentTurn === 0 && !isSpectator && !gameState.hasDrawnCard) {
          handlePlayerAction('DRAW_CARD');
        }
      });
      this.add.text(this.deckSprite.x, this.deckSprite.y + cardHeight / 2 + 10, `Deck: ${deck.length}`, { fontSize: '16px', fill: '#fff' }).setOrigin(0.5);
    }

    // Render Discard Pile
    if (discardPile && discardPile.length > 0) {
      const topDiscardCard = discardPile[discardPile.length - 1];
      const filename = `${topDiscardCard.rank}_of_${topDiscardCard.suit}.png`.toLowerCase();
      this.discardPileSprite = this.add.image(centerX + 100, centerY, filename)
        .setScale(cardWidth / this.textures.get(filename).source[0].width, cardHeight / this.textures.get(filename).source[0].height)
        .setInteractive();
      this.discardPileSprite.on('pointerdown', () => {
        if (adjustedCurrentTurn === 0 && !isSpectator && !gameState.hasDrawnCard) {
          handlePlayerAction('DRAW_DISCARD');
        }
      });
      this.add.text(this.discardPileSprite.x, this.discardPileSprite.y + cardHeight / 2 + 10, `Discard: ${discardPile.length}`, { fontSize: '16px', fill: '#fff' }).setOrigin(0.5);
    }

    // Render Players, Hands, and Spreads
    reorderedPlayers.forEach((player, playerIndex) => {
      const hand = reorderedHands[playerIndex] || [];
      const spreads = reorderedSpreads[playerIndex] || [];
      const isCurrentPlayer = playerIndex === 0;
      const isPlayerTurn = adjustedCurrentTurn === playerIndex;

      let playerX, playerY, handX, handY, spreadX, spreadY;
      let handOrientation = 'horizontal'; // or 'vertical'
      let spreadOrientation = 'horizontal';

      // Positioning logic (simplified for example, adjust as needed)
      if (isCurrentPlayer) { // Bottom player
        playerX = centerX;
        playerY = this.sys.game.config.height - 100;
        handX = centerX;
        handY = playerY - 50;
        spreadX = centerX;
        spreadY = playerY - 150;
      } else if (playerIndex === 1) { // Top player
        playerX = centerX;
        playerY = 100;
        handX = centerX;
        handY = playerY + 50;
        spreadX = centerX;
        spreadY = playerY + 150;
      } else if (playerIndex === 2) { // Left player
        playerX = 100;
        playerY = centerY;
        handX = playerX + 50;
        handY = centerY;
        handOrientation = 'vertical';
        spreadX = playerX + 150;
        spreadY = centerY;
        spreadOrientation = 'vertical';
      } else if (playerIndex === 3) { // Right player
        playerX = this.sys.game.config.width - 100;
        playerY = centerY;
        handX = playerX - 50;
        handY = centerY;
        handOrientation = 'vertical';
        spreadX = playerX - 150;
        spreadY = centerY;
        spreadOrientation = 'vertical';
      }

      // Player Name
      const playerNameText = this.add.text(playerX, playerY, player.username, { fontSize: '20px', fill: '#fff' }).setOrigin(0.5);
      if (isPlayerTurn) {
        playerNameText.setColor('#FFD700'); // Highlight current turn
      }

      // Render Hand
      const handContainer = this.add.container(0, 0);
      this.playerHandContainers.set(player.username, handContainer);
      hand.forEach((card, cardIndex) => {
        const filename = `${card.rank}_of_${card.suit}.png`.toLowerCase();
        const cardSprite = this.add.image(0, 0, isCurrentPlayer || !isSpectator ? filename : 'card_back')
          .setScale(cardWidth / this.textures.get(isCurrentPlayer || !isSpectator ? filename : 'card_back').source[0].width, cardHeight / this.textures.get(isCurrentPlayer || !isSpectator ? filename : 'card_back').source[0].height)
          .setInteractive();

        if (isCurrentPlayer && isPlayerTurn && !isSpectator) {
          cardSprite.on('pointerdown', () => {
            handleCardClick(cardIndex);
          });
          if (hitMode && selectedCard === cardIndex) {
            cardSprite.setTint(0xffd700); // Highlight selected card in hit mode
          } else {
            cardSprite.clearTint();
          }
        }

        if (handOrientation === 'horizontal') {
          cardSprite.x = (cardIndex - (hand.length - 1) / 2) * (cardWidth + cardSpacing);
        } else {
          cardSprite.y = (cardIndex - (hand.length - 1) / 2) * (cardHeight + cardSpacing);
        }
        handContainer.add(cardSprite);
        this.cardSprites.set(`${player.username}-hand-${cardIndex}`, cardSprite);
      });
      handContainer.x = handX;
      handContainer.y = handY;

      // Render Spreads
      const spreadsContainer = this.add.container(0, 0);
      this.playerSpreadContainers.set(player.username, spreadsContainer);
      let currentSpreadX = 0;
      let currentSpreadY = 0;

      spreads.forEach((spread, spreadIndex) => {
        const spreadGroup = this.add.container(currentSpreadX, currentSpreadY);
        spread.forEach((card, cardInSpreadIndex) => {
          const filename = `${card.rank}_of_${card.suit}.png`.toLowerCase();
          const cardSprite = this.add.image(0, 0, filename)
            .setScale(cardWidth / this.textures.get(filename).source[0].width, cardHeight / this.textures.get(filename).source[0].height);

          if (hitMode && selectedCard !== null && isPlayerTurn && !isSpectator) {
            const cardToHit = reorderedHands[0][selectedCard];
            if (isValidHit(cardToHit, spread)) {
              cardSprite.setTint(0x00ff00); // Highlight valid hit targets
              spreadGroup.setInteractive(new Phaser.Geom.Rectangle(0, 0, cardWidth * spread.length, cardHeight), Phaser.Geom.Rectangle.Contains);
              spreadGroup.on('pointerdown', () => {
                handleHit(playerIndex, spreadIndex);
              });
            } else {
              cardSprite.clearTint();
            }
          } else {
            cardSprite.clearTint();
          }

          if (spreadOrientation === 'horizontal') {
            cardSprite.x = cardInSpreadIndex * (cardWidth * 0.7); // Overlap cards
          } else {
            cardSprite.y = cardInSpreadIndex * (cardHeight * 0.7);
          }
          spreadGroup.add(cardSprite);
        });
        spreadsContainer.add(spreadGroup);

        if (spreadOrientation === 'horizontal') {
          currentSpreadX += spread.length * (cardWidth * 0.7) + cardSpacing * 2;
        } else {
          currentSpreadY += spread.length * (cardHeight * 0.7) + cardSpacing * 2;
        }
      });
      spreadsContainer.x = spreadX;
      spreadsContainer.y = spreadY;
    });
  }
}

export default GameplayScene;