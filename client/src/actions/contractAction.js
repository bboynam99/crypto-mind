import CryptoMind from 'contracts/CryptoMind.json';
import { checkBeforeDoTransaction } from 'actions/getInfoAction';
import { listenEventStart } from 'actions/gameAction';
import { message } from 'antd';
import getBlockNumber from 'utils/getBlockNumber';
import { getStartGame, getTrxByHash } from 'utils/getRpc';

export const CURRENT_ROOM = 'CURRENT_ROOM';
export const SCORE = 'SCORE';
export const WAITING_ROOM = 'WAITING_ROOM';
export const GAME_STATUS = 'GAME_STATUS';
export const INIT_CONTRACT = 'INIT_CONTRACT';
export const CURRENT_BLOCK = 'CURRENT_BLOCK';

export const updateWaitingRoom = () => async (dispatch, getState) => {
  const state = getState();
  const crytoMind = state.contractStatus.cryptoMind;
  let web3 = state.infoStatus.web3;
  let msg = dispatch(checkBeforeDoTransaction());
  if (!crytoMind) {
    console.log(msg);
  } else {
    const from = state.infoStatus.userAddress;
    var waitingRoomsId = await crytoMind.methods.getWaitingRoom().call({ from });
    var waitingRooms = [];

    var room = {};

    for (let i = 0; i < waitingRoomsId.length; i++) {
      room = await crytoMind.methods.rooms(waitingRoomsId[i]).call({ from });
      room.roomID = waitingRoomsId[i];
      room.bounty = web3.utils.fromWei(room.bounty);
      room.players = await crytoMind.methods.getPlayerRoom(waitingRoomsId[i]).call({ from });
      waitingRooms.push(room);
    }

    dispatch({
      type: WAITING_ROOM,
      waitingRooms
    });

    // dispatch(updateCurrentRoom());
  }
};

export const updateRoomById = (room) => async (dispatch, getState) => {
  const state = getState();
  let web3 = state.infoStatus.web3;
  let currentGame = room;
  const currentBlock = state.contractStatus.currentBlock;
  const networkId = process.env.REACT_APP_TOMO_ID;
  const contractAddress = CryptoMind.networks[networkId].address;
  const chainUrl = process.env.REACT_APP_BLOCKCHAIN_URL;
  currentGame.bounty = web3.utils.fromWei(currentGame.bounty);
  currentGame.playerCount = currentGame.players.length;
  for (let i = 0; i < currentGame.roomSize; i++) {
    if (!currentGame.players[i]) {
      currentGame.players.push(undefined);
    }
  }

  // not update blockStart = 0
  if (currentGame.blockStart === '0') {
    let res = await getStartGame(
      // fromBlock : alway read block before start game
      currentBlock - currentGame.blockTimeout,
      contractAddress,
      currentGame.roomId,
      chainUrl
    );
    if (res) {
      //update blockStart, blockTimeout
      currentGame.blockStart = res.blockStart;
      currentGame.blockTimeout = res.blockTimeout;
    }
  }
  dispatch({
    type: CURRENT_ROOM,
    currentGame
  });
};

export const updateCurrentRoomAfterQuit = () => async (dispatch, getState) => {
  const state = getState();
  const crytoMind = state.contractStatus.cryptoMind;
  let msg = dispatch(checkBeforeDoTransaction());
  if (msg) {
    console.log(msg);
  } else {
    const from = state.infoStatus.userAddress;
    const currentGame = await crytoMind.methods.roomOf(from).call({ from });
    dispatch({
      type: CURRENT_ROOM,
      currentGame
    });
  }
};

export const updateCurrentRoomAfterChangeAcc = () => (dispatch, getState) => {
  const state = getState();
  let msg = dispatch(checkBeforeDoTransaction());
  if (msg) {
    console.log(msg);
  } else {
    let currentGame = state.contractStatus.currentGame;
    let userAddress = state.infoStatus.userAddress;
    if (currentGame && userAddress) {
      let players = currentGame.players;
      if (!players.includes(userAddress)) {
        dispatch(updateCurrentRoomAfterQuit());
      }
    } else {
      return;
    }
  }
};

export const updateCurrentRoom = () => async (dispatch, getState) => {
  const state = getState();
  const crytoMind = state.contractStatus.cryptoMind;
  let web3 = state.infoStatus.web3;
  let msg = dispatch(checkBeforeDoTransaction());
  if (msg) {
    console.log(msg);
  } else {
    const currentBlock = state.contractStatus.currentBlock;
    const networkId = process.env.REACT_APP_TOMO_ID;
    const contractAddress = CryptoMind.networks[networkId].address;
    const chainUrl = process.env.REACT_APP_BLOCKCHAIN_URL;
    const from = state.infoStatus.userAddress;
    let lastGame = state.contractStatus.currentGame;
    if (
      lastGame &&
      //lastGame is running
      (parseInt(lastGame.blockStart) + parseInt(lastGame.blockTimeout) > parseInt(currentBlock) ||
        //lastGame is waitting
        (parseInt(lastGame.blockStart) === 0 && lastGame.roomId !== '0'))
    ) {
      return;
    } else {
      let currentGame = await crytoMind.methods.roomOf(from).call({ from });

      currentGame.bounty = web3.utils.fromWei(currentGame.bounty);
      currentGame.players = await crytoMind.methods
        .getPlayerRoom(currentGame.roomId)
        .call({ from });
      currentGame.playerCount = currentGame.players.length;

      for (let i = 0; i < currentGame.roomSize; i++) {
        if (!currentGame.players[i]) {
          currentGame.players.push(undefined);
        }
      }

      // not update blockStart = 0

      if (currentGame.blockStart === '0') {
        let res = await getStartGame(
          // fromBlock : alway read block before start game
          currentBlock - currentGame.blockTimeout,
          contractAddress,
          currentGame.roomId,
          chainUrl
        );
        if (res) {
          //update blockStart, blockTimeout
          currentGame.blockStart = res.blockStart;
          currentGame.blockTimeout = res.blockTimeout;
        }
      }
      dispatch({
        type: CURRENT_ROOM,
        currentGame
      });
    }
  }
};

export const createRoom = (bounty, roomSize, blockTimeout) => async (dispatch, getState) => {
  const state = getState();
  const crytoMind = state.contractStatus.cryptoMind;
  let web3 = state.infoStatus.web3;
  let msg = dispatch(checkBeforeDoTransaction());
  if (msg) {
    message.warning(msg);
  } else {
    const from = state.infoStatus.userAddress;
    // remove score in localstorage
    localStorage.removeItem(`Crypto_${from}_score`);

    bounty = web3.utils.toWei(bounty, 'ether');
    await crytoMind.methods
      .createRoom(bounty, roomSize, blockTimeout)
      .send({ from: from, value: bounty, gasPrice: '250000000', gas: 1000000 })
      .then(() => {
        dispatch(updateCurrentRoom());
      })
      .catch((e) => {
        console.log("Error: can't create room", e);
      });
  }
};

export const joinRoom = (roomID, bounty) => async (dispatch, getState) => {
  const state = getState();
  const crytoMind = state.contractStatus.cryptoMind;
  let web3 = state.infoStatus.web3;
  let msg = dispatch(checkBeforeDoTransaction());
  if (msg) {
    message.warning(msg);
  } else {
    const from = state.infoStatus.userAddress;
    // remove score in localstorage
    localStorage.removeItem(`Crypto_${from}_score`);

    bounty = web3.utils.toWei(bounty, 'ether');

    await crytoMind.methods
      .joinRoom(roomID)
      .send({ from: from, value: bounty, gasPrice: '250000000', gas: 1000000 })
      .on('transactionHash', async (hash) => {
        let interval = setInterval(async function() {
          let trx = await getTrxByHash(hash, process.env.REACT_APP_BLOCKCHAIN_URL);
          dispatch(listenBlockStart(roomID, trx, interval));
        }, 1000);
      })
      .catch((e) => {
        console.log("Error: can't join room", e);
      });
  }
};

const listenBlockStart = (roomId, trx, interval) => async (dispatch, getState) => {
  const state = getState();
  let web3 = state.infoStatus.web3;
  const crytoMind = state.contractStatus.cryptoMind;
  if (web3 && crytoMind) {
    let room = await crytoMind.methods.roomById(roomId).call();
    if (trx.result) {
      if (trx.result.status === '0x1') {
        await dispatch(updateRoomById(room));
        await dispatch(listenEventStart());
        clearInterval(interval);
      } else {
        message.warning('Room was full');
        clearInterval(interval);
      }
    }
  }
};

export const quitGame = () => async (dispatch, getState) => {
  const state = getState();
  const crytoMind = state.contractStatus.cryptoMind;
  let msg = dispatch(checkBeforeDoTransaction());
  if (msg) {
    message.warning(msg);
  } else {
    const from = state.infoStatus.userAddress;
    await crytoMind.methods
      .quitGame()
      .send({ from: from, gasPrice: '250000000', gas: 1000000 })
      .then(() => {
        dispatch(updateCurrentRoomAfterQuit());
      })
      .catch((e) => {
        console.log("Error: can't quit room", e);
      });
  }
};

export const submitAnswer = () => async (dispatch, getState) => {
  const state = getState();
  let cryptoMind = state.contractStatus.cryptoMind;
  let score = state.gameStatus.score;

  let msg = dispatch(checkBeforeDoTransaction());
  if (msg) {
    console.log(msg);
  } else {
    const from = state.infoStatus.userAddress;
    await cryptoMind.methods
      .submitAnswer(score)
      .send({ from: from, gasPrice: '250000000', gas: 1000000 })
      .then(() => {
        // dispatch(gameStatus());
        console.log('success');
      })
      .catch((e) => {
        console.log("Error: can't create room", e);
      });
  }
};

export const updateCurrentBlock = () => async (dispatch, getState) => {
  let res = await getBlockNumber(process.env.REACT_APP_BLOCKCHAIN_URL);
  let currentBlock = parseInt(res.result, 16);

  dispatch({
    type: CURRENT_BLOCK,
    currentBlock
  });
};

export const initContract = () => async (dispatch, getState) => {
  const state = getState();
  let web3 = state.infoStatus.web3;
  if (web3) {
    const networkId = process.env.REACT_APP_TOMO_ID;
    let cryptoMindAddress = CryptoMind.networks[networkId].address;
    let cryptoMind = new web3.eth.Contract(CryptoMind.abi, cryptoMindAddress, {
      transactionConfirmationBlocks: 1
    });
    dispatch({
      type: INIT_CONTRACT,
      cryptoMind
    });
  }
};
