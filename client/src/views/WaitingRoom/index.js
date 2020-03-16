import React, { useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { Row, Col, Layout, Icon, Badge } from 'antd';

import AvatarUser from 'components/AvatarUser';
import RedirectRouter from 'components/RedirectRouter';
import { Link, useHistory } from 'react-router-dom';
import * as contract from 'actions/contractAction';
import * as game from 'actions/gameAction';

import './waitingRoom.css';
import useInterval from 'useInterval';
import PixelButton from 'components/PixelButton';
const { Header, Content, Footer } = Layout;

function WaitingRoom() {
  const roomStatus = useSelector((state) => state.contractStatus);
  const contractStatus = useSelector((state) => state.contractStatus);
  const infoStatus = useSelector((state) => state.infoStatus);
  const currentGame = roomStatus.currentGame;
  const dispatch = useDispatch();

  let history = useHistory();

  useEffect(() => {
    dispatch(game.listenEventStart());
    dispatch(game.listenJoinRoom());
    dispatch(game.listenQuitRoom());
  }, [roomStatus.blockStart, dispatch, currentGame]);

  useEffect(() => {
    if (!contractStatus.currentGame) dispatch(contract.updateCurrentRoom());
  }, [dispatch, contractStatus]);

  useEffect(() => {
    dispatch(contract.updateCurrentRoomAfterChangeAcc());
  }, [dispatch, infoStatus.userAddress]);

  useInterval(() => {
    dispatch(game.listenEventStart());
    dispatch(contract.updateCurrentRoom());
  }, 1000);

  return (
    <Layout>
      <RedirectRouter />
      <Header>
        <Row type='flex' justify='space-between'>
          <Col xs={4}>
            <div onClick={() => dispatch(contract.quitGame())}>
              <Icon type='left' style={{ fontSize: '15px', color: '#fff' }} />
            </div>
          </Col>
          <Col xs={4}>
            <Link to='/profile' onClick={() => history.push('/waiting')}>
              <AvatarUser address={infoStatus.userAddress} icon='user' size='large' />
            </Link>
          </Col>
        </Row>
      </Header>

      <Content>
        <Row gutter={[0, 16]} type='flex' justify='center'>
          <Col span={24} className='title-waiting'>
            <p>Waiting Room</p>
          </Col>
          {currentGame ? (
            <>
              <Col xs={18}>
                <Row className='info-room' type='flex' justify='space-around' align='middle'>
                  <span>RoomID: {currentGame.roomId} </span>
                  <span>
                    <Badge
                      style={{ fontSize: '8px' }}
                      count={currentGame.playerCount + '/' + currentGame.roomSize}
                    >
                      <div className='clock'>
                        <div className='pixel_user'></div>
                      </div>
                    </Badge>
                  </span>

                  <span>
                    <Badge
                      style={{ fontSize: '8px' }}
                      count={((currentGame.blockTimeout - 6) * 2) / 10 + 'S'}
                    >
                      <div className='clock'>
                        <div className='pixel_clock' />
                      </div>
                    </Badge>
                  </span>

                  <span>
                    <Badge style={{ fontSize: '8px' }} count={currentGame.bounty}>
                      <div className='clock'>
                        <div className='pixel_coin' />
                      </div>
                    </Badge>
                  </span>
                </Row>
              </Col>

              <Col span={22} className='des_mg'>
                <p>
                  Players have to pass 10 questions about mental arithmetic by beat other players to
                  record prize of game.
                </p>
              </Col>

              {currentGame.players.map((player, index) =>
                player ? (
                  <Col key={index} span={20} offset={4} className='addres-user'>
                    <Row type='flex' align='middle'>
                      <div className='clock'>
                        <div className='pixel_checked' />
                      </div>
                      <span className='sp_m'>{` ${player.substr(0, 6)}...${player.substr(
                        -4
                      )}`}</span>
                    </Row>
                  </Col>
                ) : (
                  <Col key={index} span={20} offset={4} className='addres-user'>
                    <Row type='flex' align='middle'>
                      <div className='clock'>
                        <div className='pixel_loading' />
                      </div>
                      <span className='sp_m'> Waiting User</span>
                    </Row>
                  </Col>
                )
              )}
            </>
          ) : (
            <></>
          )}
        </Row>
      </Content>
      <Footer>
        <div className='ft_size' onClick={() => dispatch(contract.quitGame())}>
          <PixelButton title='Quit' type='danger' size='large' />
        </div>
      </Footer>
    </Layout>
  );
}

export default WaitingRoom;
