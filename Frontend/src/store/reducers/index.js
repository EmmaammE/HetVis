import { combineReducers } from 'redux';
import basicReducer from './basic';
import blockIndexReducer from './blockIndex';
// import identifyReducer from './identify';
import serviceReducer from './service';
// import leftPanelReducer from './leftPanelReducer';

export default combineReducers({
  // leftPanel: leftPanelReducer,
  blockIndex: blockIndexReducer,
  service: serviceReducer,
  basic: basicReducer,
});
