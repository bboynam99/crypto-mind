import React from 'react';
import { useSelector } from 'react-redux';
import { Redirect } from 'react-router-dom';

function RedirectRouter({ redirectTo }) {
  const currentGame = useSelector((state) => state.contractStatus.currentGame);
  const currentBlock = useSelector((state) => state.contractStatus.currentBlock);

  return (
    <div>
      {currentGame ? (
        currentGame.result === '0' ? (
          currentGame.blockStart === '0' ? (
            <Redirect to='/waiting' />
          ) : parseInt(currentBlock) >
            parseInt(currentGame.blockStart) + parseInt(currentGame.blockTimeout) ? (
            <Redirect to={redirectTo} />
          ) : (
            <Redirect to='/battleGame' />
          )
        ) : (
          <Redirect to={redirectTo} />
        )
      ) : (
        <></>
      )}
    </div>
  );
}

export default RedirectRouter;
