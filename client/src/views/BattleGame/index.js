import React, { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import * as gameAction from 'actions/gameAction';
import * as contractAction from 'actions/contractAction';
import { Row, Col, Icon, Layout, message, Spin } from 'antd';
import Game from 'components/Game';
import { Redirect, Link, useHistory } from 'react-router-dom';
import * as contract from 'actions/contractAction';
import * as game from 'actions/gameAction';
import AvatarUser from 'components/AvatarUser';
import useInterval from 'useInterval';
import './battleGame.css';
import PixelButton from 'components/PixelButton';
const { Header, Footer } = Layout;

function BattleGame() {
  const dispatch = useDispatch();
  const gameStatus = useSelector((state) => state.gameStatus);
  const contractStatus = useSelector((state) => state.contractStatus);
  const infoStatus = useSelector((state) => state.infoStatus);
  let timePerQues = 0;
  const [targetTime, setTargetTime] = useState(Date.now() + timePerQues * 1000);
  const [isAnswer, setIsAnswer] = useState(false);
  if (contractStatus.currentGame) {
    // 6 block for submit
    timePerQues = ((contractStatus.currentGame.blockTimeout - 6) / 10) * 2;
  }
  let history = useHistory();
  useEffect(() => {
    dispatch(game.listenEventStart());
    setTargetTime(Date.now() + timePerQues * 1000);
  }, [contractStatus.blockStart, dispatch, timePerQues]);

  useEffect(() => {
    dispatch(contract.updateCurrentRoom());
  }, [dispatch, contractStatus.cryptoMind]);

  useInterval(() => {
    dispatch(contract.updateCurrentRoom());
  }, 1000);

  function onFinish() {
    if (gameStatus.currentQues >= 9) {
      message.loading('Ready for submit', 1).then(() => dispatch(contractAction.submitAnswer()));
    } else {
      dispatch(gameAction.updateCurrentQuestion(gameStatus.currentQues + 1));
      setTargetTime(Date.now() + timePerQues * 1000);
      setIsAnswer(false);
    }
  }

  async function checkAns(ans) {
    /* eslint no-eval: 0 */
    if (eval(gameStatus.battleQuestions[gameStatus.currentQues].ques) === ans) {
      setIsAnswer(true);
      await message.loading('Submiting..', 0.5);
      dispatch(gameAction.updateScore(gameStatus.score + 1));
      message.success('Answer correct', 1.0);
    } else {
      setIsAnswer(true);
      await message.loading('Submiting..', 0.5);
      message.error('Answer wrong', 1.0);
    }
  }

  return (
    <Layout>
      <Header>
        <Row type='flex' justify='space-between'>
          <Col xs={4} onClick={() => dispatch(contract.quitGame())}>
            <Icon type='left' style={{ fontSize: '15px', color: '#fff' }} />
          </Col>
          <Col xs={4}>
            <Link to='/profile' onClick={() => history.push('/battleGame')}>
              <AvatarUser address={infoStatus.userAddress} icon='user' size='large' />
            </Link>
          </Col>
        </Row>
      </Header>
      {/*
          currentBlock < blockstart + blockTimeout: Must not run out of time
       */}
      {contractStatus.currentGame ? (
        contractStatus.currentBlock <
        parseInt(contractStatus.currentGame.blockStart) +
          parseInt(contractStatus.currentGame.blockTimeout) ? (
          <Game
            targetTime={targetTime}
            onFinish={onFinish}
            isAnswer={isAnswer}
            checkAns={checkAns}
            question={gameStatus.battleQuestions}
          />
        ) : (
          <Redirect push to='/reward' />
        )
      ) : (
        <div>
          <Spin className='loading' size='large' />
        </div>
      )}
      <Footer>
        <div className='ft_size' onClick={() => dispatch(contract.quitGame())}>
          <PixelButton title='Quit' type='danger' size='large' />
        </div>
      </Footer>
    </Layout>
  );
}

export default BattleGame;
