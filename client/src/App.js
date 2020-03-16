import React, { useEffect } from 'react';
import { useDispatch } from 'react-redux';
import useInterval from './useInterval';
import * as getUserInfo from './actions/getInfoAction';
import * as contract from 'actions/contractAction';
import Router from './router';

import './App.css';

function App() {
  const dispatch = useDispatch();

  useEffect(() => {
    const getWeb3 = () => {
      window.addEventListener('load', async () => {
        await dispatch(getUserInfo.web3Connect());
      });
    };
    getWeb3();
  });

  useEffect(() => {
    dispatch(contract.updateCurrentBlock());
  }, [dispatch]);

  useInterval(() => {
    dispatch(getUserInfo.getProfile());
    dispatch(contract.updateCurrentBlock());
  }, 2000);

  return (
    <div className='App pixel_font'>
      <Router />
    </div>
  );
}

export default App;
