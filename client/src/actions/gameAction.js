import { genQuestionIncLv } from 'utils/genQuestion';
import { checkBeforeDoTransaction } from 'actions/getInfoAction';
import { CURRENT_ROOM } from 'actions/contractAction';
import { getStartGame } from 'utils/getRpc';
import CryptoMind from 'contracts/CryptoMind.json';
import CryptoJS from 'crypto-js';

export const CURRENT_QUES = 'CURRENT_QUES';
export const SCORE = 'SCORE';
export const UPDATE_QUESTIONS = 'UPDATE_QUESTIONS';
export const GAME_RESULT = 'GAME_RESULT';

export const updateCurrentQuestion = (currentQues) => async (dispatch) => {
  dispatch({
    type: CURRENT_QUES,
    currentQues
  });
};

export const updateScore = (score) => async (dispatch, getState) => {
  const state = getState();
  let currentGame = state.contractStatus.currentGame;
  let userAddress = state.infoStatus.userAddress;
  var scoreEncrypt = CryptoJS.AES.encrypt(
    currentGame.roomId + '_' + score.toString(),
    process.env.REACT_APP_SECRET_KEY
  ).toString();
  localStorage.setItem(`Crypto_${userAddress}_score`, scoreEncrypt);
  score = parseInt(score);
  dispatch({
    type: SCORE,
    score
  });
};

export const getResultOfRoom = () => async (dispatch, getState) => {
  const state = getState();
  let cryptoMind = state.contractStatus.cryptoMind;
  let currentGame = state.contractStatus.currentGame;
  let msg = dispatch(checkBeforeDoTransaction());
  if (msg) {
    console.log(msg);
  } else {
    const from = state.infoStatus.userAddress;
    if (currentGame) {
      let submitedPlayers = currentGame.submited;
      let roomId = currentGame.roomId;
      // Promise
      let getAllScore = submitedPlayers.map(async (submitedPlayer) => {
        let player = {};
        player.address = submitedPlayer;
        player.score = await cryptoMind.methods
          .getAnswerInRoom(submitedPlayer, roomId)
          .call({ from });
        return player;
      });

      let gameResult = await Promise.all(getAllScore);

      // sort by score
      gameResult.sort((a, b) => b.score - a.score);

      dispatch({
        type: GAME_RESULT,
        gameResult
      });
    }
  }
};

export const listenEventStart = () => async (dispatch, getState) => {
  const state = getState();
  let currentGame = state.contractStatus.currentGame;
  let web3 = state.infoStatus.web3;
  if (currentGame && web3) {
    let currentBlock = state.contractStatus.currentBlock;

    const networkId = process.env.REACT_APP_TOMO_ID;
    const contractAddress = CryptoMind.networks[networkId].address;
    const chainUrl = process.env.REACT_APP_BLOCKCHAIN_URL;
    const userAddress = state.infoStatus.userAddress;

    if (currentGame.blockStart > 0) {
      let res = await getStartGame(
        currentGame.blockStart,
        contractAddress,
        currentGame.roomId,
        chainUrl
      );
      if (res) {
        let battleQuestions = genQuestionIncLv(res.seed, 10);

        // update current Question
        let blockPerQues = (currentGame.blockTimeout - 6) / 10;
        let currentQuestion;
        if (currentBlock !== currentGame.blockStart) {
          // rounded up
          currentQuestion = Math.ceil((currentBlock - currentGame.blockStart) / blockPerQues);
        } else {
          currentQuestion = 0;
        }
        dispatch(updateCurrentQuestion(currentQuestion));

        // update current Score
        let score;
        if ((score = localStorage.getItem(`Crypto_${userAddress}_score`))) {
          //if localStorage have score
          let bytes = CryptoJS.AES.decrypt(score, process.env.REACT_APP_SECRET_KEY);
          let scoreOfRoom = bytes.toString(CryptoJS.enc.Utf8).split('_');
          //compare roomId if correct save score , wrong score = 0
          scoreOfRoom[0] === currentGame.roomId ? (score = scoreOfRoom[1]) : (score = 0);
        } else {
          score = 0;
        }
        dispatch(updateScore(score));

        dispatch({
          type: UPDATE_QUESTIONS,
          battleQuestions
        });

        //update blockStart, blockTimeout
        currentGame.blockStart = res.blockStart;
        currentGame.blockTimeout = res.blockTimeout;
        dispatch({
          type: CURRENT_ROOM,
          currentGame
        });
      }
    } else {
      let res = await getStartGame(currentBlock, contractAddress, currentGame.roomId, chainUrl);
      if (res) {
        let battleQuestions = genQuestionIncLv(res.seed, 10);

        // update currentQuestion
        let blockPerQues = (currentGame.blockTimeout - 6) / 10;
        let currentQuestion;
        if (currentBlock !== currentGame.blockStart) {
          // rounded up
          currentQuestion = Math.ceil((currentBlock - currentGame.blockStart) / blockPerQues);
        } else {
          currentQuestion = 0;
        }
        dispatch(updateCurrentQuestion(currentQuestion));

        // update current Score
        let score;
        if ((score = localStorage.getItem(`Crypto_${userAddress}_score`))) {
          //if localStorage have score
          let bytes = CryptoJS.AES.decrypt(score, process.env.REACT_APP_SECRET_KEY);
          let scoreOfRoom = bytes.toString(CryptoJS.enc.Utf8).split('_');
          //compare roomId if correct save score , wrong score = 0
          scoreOfRoom[0] === currentGame.roomId ? (score = scoreOfRoom[1]) : (score = 0);
        } else {
          score = 0;
        }
        dispatch(updateScore(score));

        dispatch({
          type: UPDATE_QUESTIONS,
          battleQuestions
        });

        //update blockStart, blockTimeout
        currentGame.blockStart = res.blockStart;
        currentGame.blockTimeout = res.blockTimeout;
        dispatch({
          type: CURRENT_ROOM,
          currentGame
        });
      }
    }
  }
};

export const listenJoinRoom = () => async (dispatch, getState) => {
  const state = getState();
  let cryptoMindSocket = state.contractStatus.cryptoMindSocket;
  let currentGame = state.contractStatus.currentGame;
  let web3 = state.infoStatus.web3;
  if (currentGame && web3) {
    let currentBlock = state.contractStatus.currentBlock;
    cryptoMindSocket.events
      .JoinRoom(
        {
          filter: { roomId: [currentGame.roomId] },
          fromBlock: currentBlock
        },
        function(error) {
          console.log(error);
        }
      )
      .on('data', (events) => {
        if (events) {
          let players = currentGame.players;
          let newPlayer = events.returnValues['newPlayer'];
          if (players.indexOf(newPlayer) < 0 && players.indexOf(undefined) >= 0) {
            players[players.indexOf(undefined)] = newPlayer;
            currentGame.playerCount++;
          }
          currentGame.players = players;
          dispatch({
            type: CURRENT_ROOM,
            currentGame
          });
        }
      })
      .on('error', console.error);
  }
};

export const listenQuitRoom = () => async (dispatch, getState) => {
  const state = getState();
  let cryptoMindSocket = state.contractStatus.cryptoMindSocket;
  let currentGame = state.contractStatus.currentGame;
  let web3 = state.infoStatus.web3;
  if (currentGame && web3) {
    let currentBlock = state.contractStatus.currentBlock;
    cryptoMindSocket.events
      .QuitRoom(
        {
          filter: { roomId: [currentGame.roomId] },
          fromBlock: currentBlock
        },
        function(error) {
          console.log(error);
        }
      )
      .on('data', (events) => {
        if (events) {
          currentGame = getState().contractStatus.currentGame;
          let players = currentGame.players;
          let quitPlayer = events.returnValues['quitPlayer'];
          if (players.indexOf(quitPlayer) >= 0) {
            players[players.indexOf(quitPlayer)] = undefined;
            currentGame.playerCount--;
          }
          currentGame.players = players;
          dispatch({
            type: CURRENT_ROOM,
            currentGame
          });
        }
      })
      .on('error', console.error);
  }
};
