export const CARD_VALUES = {
    'ace': 1, '2': 2, '3': 3, '4': 4, '5': 5, '6': 6, '7': 7, 'J': 10, 'Q': 10, 'K': 10
  };
  
  export const INITIAL_DECK = [
    { rank: '2', suit: 'Hearts' }, { rank: '2', suit: 'Diamonds' },
    { rank: '2', suit: 'Clubs' }, { rank: '2', suit: 'Spades' },
    { rank: '3', suit: 'Hearts' }, { rank: '3', suit: 'Diamonds' },
    { rank: '3', suit: 'Clubs' }, { rank: '3', suit: 'Spades' },
    { rank: '4', suit: 'Hearts' }, { rank: '4', suit: 'Diamonds' },
    { rank: '4', suit: 'Clubs' }, { rank: '4', suit: 'Spades' },
    { rank: '5', suit: 'Hearts' }, { rank: '5', suit: 'Diamonds' },
    { rank: '5', suit: 'Clubs' }, { rank: '5', suit: 'Spades' },
    { rank: '6', suit: 'Hearts' }, { rank: '6', suit: 'Diamonds' },
    { rank: '6', suit: 'Clubs' }, { rank: '6', suit: 'Spades' },
    { rank: '7', suit: 'Hearts' }, { rank: '7', suit: 'Diamonds' },
    { rank: '7', suit: 'Clubs' }, { rank: '7', suit: 'Spades' },
    { rank: 'J', suit: 'Hearts' }, { rank: 'J', suit: 'Diamonds' },
    { rank: 'J', suit: 'Clubs' }, { rank: 'J', suit: 'Spades' },
    { rank: 'Q', suit: 'Hearts' }, { rank: 'Q', suit: 'Diamonds' },
    { rank: 'Q', suit: 'Clubs' }, { rank: 'Q', suit: 'Spades' },
    { rank: 'K', suit: 'Hearts' }, { rank: 'K', suit: 'Diamonds' },
    { rank: 'K', suit: 'Clubs' }, { rank: 'K', suit: 'Spades' },
    { rank: 'ace', suit: 'Hearts' }, { rank: 'ace', suit: 'Diamonds' },
    { rank: 'ace', suit: 'Clubs' }, { rank: 'ace', suit: 'Spades' }
  ];
  
  export const GAME_RULES = {
    INITIAL_HAND_SIZE: 5,
    MIN_SPREAD_SIZE: 3,
    STAKE_OPTIONS: [1, 5, 10, 20, 50, 100]
  };

  export const GAME_EVENTS = {
    DRAW: 'DRAW_CARD',
    DISCARD: 'DISCARD_CARD',
    SPREAD: 'MAKE_SPREAD',
    HIT: 'MAKE_HIT',
    END_GAME: 'END_GAME'
};

export const GAME_STATES = {
  LOADING: 'loading',
  ACTIVE: 'active',
  ENDED: 'ended'
};

export const PLAYER_POSITIONS = ['top', 'right', 'bottom', 'left'];


export const GAME_MESSAGES = {
  LOADING: 'Loading Game...',
  GAME_OVER: 'Game Over',
  AI_TURN: "AI's turn"
};

  