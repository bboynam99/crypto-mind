import React, { useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { Link, useHistory } from 'react-router-dom';

import { Layout, Row, Col } from 'antd';
import AvatarUser from 'components/AvatarUser';

import './reward.css';
import useInterval from 'useInterval';
import * as contract from 'actions/contractAction';
import * as gameActions from 'actions/gameAction';
import PixelButton from 'components/PixelButton';

function Reward() {
  const { Header, Footer, Content } = Layout;
  const gameStatus = useSelector((state) => state.gameStatus);
  const infoStatus = useSelector((state) => state.infoStatus);
  const dispatch = useDispatch();
  let history = useHistory();

  useEffect(() => {
    dispatch(gameActions.getResultOfRoom());
  }, [dispatch, gameStatus.gameResult.length]);

  useInterval(() => {
    dispatch(contract.updateCurrentRoom());
    dispatch(gameActions.getResultOfRoom());
  }, 1000);

  return (
    <Layout>
      <Header>
        <Row type='flex' justify='space-between'>
          <Col></Col>
          <Col xs={4}>
            <Link to='/profile' onClick={() => history.push('/reward')}>
              <AvatarUser address={infoStatus.userAddress} icon='user' size='large' />
            </Link>
          </Col>
        </Row>
      </Header>
      <Content>
        <Row type='flex' justify='center' align='middle' className='h_100per'>
          <Col span={20}>
            <h1 className='t_bold' style={{ marginBottom: '40px' }}>
              BATTLE REWARDS
            </h1>

            {gameStatus.gameResult.map((player, index) => (
              <Row type='flex' justify='space-around' key={index}>
                <Col span={4}>
                  <AvatarUser address={player.address} size={50} icon='user' />
                </Col>
                <Col span={20} className='a_left mg_b'>
                  {player.address === infoStatus.userAddress ? (
                    <p>YOU</p>
                  ) : (
                    <p className='fs_09em'>
                      {` ${player.address.substr(0, 10)}...${player.address.substr(-15)}`}
                    </p>
                  )}

                  <p className='t_bold'>Score : {player.score}</p>
                </Col>
              </Row>
            ))}
          </Col>
        </Row>
      </Content>
      <Footer>
        <Link to='/'>
          <PixelButton title='Back' type='danger' size='large' />
        </Link>
      </Footer>
    </Layout>
  );
}

export default Reward;
