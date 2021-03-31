import React from 'react';
import './App.scss';
import { useSelector } from 'react-redux';
import { ModalProvider } from 'react-modal-hook';
import RightPanel from './panels/rightPanel/Panel';
import BottomPanel from './panels/BottomPanel/BottomPanel';
import LeftPanel from './panels/leftPanel/LeftPanel';
import MiddlePanel from './panels/middlePanel/MiddlePanel';
import { StateType } from './types/data';

function App() {
  const loading = useSelector((state: StateType) => state.service.loading);

  // console.log('loading', loading);
  return (
    <div className="App">
      <ModalProvider>
        <div className="loader" style={{ display: loading ? 'flex' : 'none' }}>
          <div className="ball first" />
          <div className="ball second" />
          <div className="ball third" />
        </div>
        <LeftPanel />
        <MiddlePanel />
        <RightPanel />
        <BottomPanel />
      </ModalProvider>
    </div>
  );
}

export default App;
