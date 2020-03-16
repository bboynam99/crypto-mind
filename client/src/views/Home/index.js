import React, { useEffect } from 'react';
import { Row, Col, Layout } from 'antd';
import { Link, useHistory } from 'react-router-dom';
import AvatarUser from 'components/AvatarUser';
import { useSelector, useDispatch } from 'react-redux';
import PixelButton from 'components/PixelButton';
import * as room from 'actions/contractAction';

import './home.css';
import RedirectRouter from 'components/RedirectRouter';

const { Header, Content, Footer } = Layout;

function Home() {
  let history = useHistory();

  const infoStatus = useSelector((state) => state.infoStatus);
  const dispatch = useDispatch();

  useEffect(() => {
    dispatch(room.updateCurrentRoom());
  }, [dispatch, infoStatus.userAddress]);

  return (
    <div>
      <RedirectRouter redirectTo='/' />

      <Layout>
        <Header>
          <Row type='flex' justify='space-between'>
            <Col xs={4} />
            <Col xs={4}>
              <Link to='/profile' onClick={() => history.push('/')}>
                <AvatarUser address={infoStatus.userAddress} size='large' icon='user' />
              </Link>
            </Col>
          </Row>
        </Header>

        <Content>
          <Row gutter={[0, 16]} type='flex' justify='center'>
            <Col xs={24}>
              <Link to='/training'>
                <PixelButton title='Training Mode' type='primary' size='large' />
              </Link>
            </Col>

            <Col xs={24}>
              <Link to='/battle'>
                <PixelButton title='Battle Mode' type='danger' size='large' />
              </Link>
            </Col>
          </Row>
        </Content>
        <Footer></Footer>
      </Layout>
    </div>
  );
}

export default Home;
