import React, { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import useInterval from 'useInterval';
import { Row, Col, Badge, Icon, Layout, Modal } from 'antd';
import { Link, useHistory } from 'react-router-dom';
import RedirectRouter from 'components/RedirectRouter';
import CreateGame from 'views/CreateGame';
import AvatarUser from 'components/AvatarUser';
import * as room from 'actions/contractAction';
import * as contract from 'actions/contractAction';

import './battleMode.css';
import PixelButton from 'components/PixelButton';

const { Header, Content, Footer } = Layout;

function BattleMode() {
  const [bounty, setBounty] = useState('3');
  const [roomSize, setRoomSize] = useState('2');
  const [blockTimeout, setBlockTimeout] = useState('6');
  const content = useSelector((state) => state.contractStatus);
  const infoStatus = useSelector((state) => state.infoStatus);
  const dispatch = useDispatch();
  const [visible, setVisible] = useState(false);

  let history = useHistory();

  useEffect(() => {
    dispatch(room.updateWaitingRoom());
    dispatch(room.updateCurrentRoom());
  }, [dispatch, infoStatus.userAddress]);

  useInterval(() => {
    dispatch(room.updateWaitingRoom());
    dispatch(contract.updateCurrentRoom());
  }, 2000);

  function selectRoom(id, bounty) {
    // dispatch(room.updateCurrentRoom(id));
    dispatch(room.joinRoom(id, bounty));
  }

  function createGame(bounty, roomSize, timePerQues) {
    // 4 block for submit
    const blockTimeout = (timePerQues / 2) * 10 + 6;
    dispatch(room.createRoom(bounty, roomSize, blockTimeout));
    setVisible(false);
  }

  return (
    <Layout>
      <RedirectRouter />
      <Modal
        title=''
        visible={visible}
        onOk={() => createGame(bounty, roomSize, blockTimeout)}
        onCancel={() => setVisible(false)}
      >
        <CreateGame
          bounty={bounty}
          setBounty={setBounty}
          roomSize={roomSize}
          setRoomSize={setRoomSize}
          blockTimeout={blockTimeout}
          setBlockTimeout={setBlockTimeout}
        />
      </Modal>
      <Header>
        <Row type='flex' justify='space-between'>
          <Col xs={4}>
            <Link to='/'>
              <Icon type='left' style={{ fontSize: '15px', color: '#fff' }} />
            </Link>
          </Col>
          <Col xs={4}>
            <Link to='/profile' onClick={() => history.push('/battle')}>
              <AvatarUser address={infoStatus.userAddress} icon='user' size='large' />
            </Link>
          </Col>
        </Row>
      </Header>
      <Content className='overflow'>
        {content.waitingRooms ? (
          content.waitingRooms.map((game, index) => (
            <Row
              gutter={[0, 16]}
              type='flex'
              justify='center'
              align='middle'
              key={index}
              style={{ margin: '0px 8px' }}
            >
              <Col xs={18}>
                <Row className='info-room' type='flex' justify='space-around' align='middle'>
                  <span>RoomID: {game.roomID} </span>
                  <span>
                    <Badge
                      style={{ fontSize: '8px' }}
                      count={game.players.length + '/' + game.roomSize}
                    >
                      <div className='clock'>
                        <div className='pixel_user'></div>
                      </div>
                    </Badge>
                  </span>

                  <span>
                    <Badge
                      style={{ fontSize: '8px' }}
                      count={((game.blockTimeout - 6) * 2) / 10 + 'S'}
                    >
                      <div className='clock'>
                        <div className='pixel_clock' />
                      </div>
                    </Badge>
                  </span>

                  <span>
                    <Badge style={{ fontSize: '8px' }} count={game.bounty}>
                      <div className='clock'>
                        <div className='pixel_coin' />
                      </div>
                    </Badge>
                  </span>
                </Row>
              </Col>

              <Col xs={6}>
                <div onClick={() => selectRoom(game.roomID, game.bounty)}>
                  <PixelButton title='Join' type='danger' size='small' />
                </div>
              </Col>
            </Row>
          ))
        ) : (
          <p></p>
        )}
      </Content>
      <Footer>
        <div className='ft_size' onClick={() => setVisible(true)}>
          <PixelButton title='Create Room' type='primary' size='large' />
        </div>
      </Footer>
    </Layout>
  );
}

export default BattleMode;
