import * as contract from 'actions/contractAction';

const initialState = {
  waitingRooms: null,
  currentGame: null,
  cryptoMind: null,
  cryptoMindSocket: null,
  currentBlock: 0
};

const roomReducer = (state = initialState, action) => {
  switch (action.type) {
    case contract.CURRENT_ROOM:
      return {
        ...state,
        currentGame: action.currentGame
      };
    case contract.WAITING_ROOM:
      return {
        ...state,
        waitingRooms: action.waitingRooms
      };
    case contract.INIT_CONTRACT:
      return {
        ...state,
        cryptoMind: action.cryptoMind,
        cryptoMindSocket: action.cryptoMindSocket
      };
    case contract.CURRENT_BLOCK:
      return {
        ...state,
        currentBlock: action.currentBlock
      };
    case contract.INIT_SOCKET:
      return {
        ...state,
        cryptoMindSocket: action.cryptoMindSocket
      };
    default:
      return state;
  }
};

export default roomReducer;
