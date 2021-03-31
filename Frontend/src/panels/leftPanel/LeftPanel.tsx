import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import Overview, { OverviewData } from '../../components/overview/Overview';
import './style.scss';
import Gradient from '../../components/ui/Gradient';
import RangeSlider from '../../components/ui/RangeSlider';
import Dropdown from '../../components/ui/Dropdown';
import {
  initBasicData,
  setLabelNamesAction,
  setNameAction,
  setRoundAction,
} from '../../store/reducers/basic';
import { StateType } from '../../types/data';
import {
  initIdentityAction,
  setLevelAction,
  onTypeUpdateOrInitAction,
} from '../../store/reducers/service';
import HTTP_LEVEL from '../../utils/level';
import { getType, setDatasetInfo } from '../../utils/getType';

const fakeData = {
  // 联邦模型矢量
  server: [],
  local: [],
  cosines: [],
  weight0: [],
};

interface Info {
  // 拼接成字符串
  labels: string;
  dimensions: number | '' | string;
  numberOfClients: number | '';
  communicationRounds: number | '';
  testDataSize: number | '';
  trainingDataSize: number | '';
}

const initInfo: Info = {
  labels: '',
  dimensions: '',
  numberOfClients: '',
  communicationRounds: '',
  testDataSize: '',
  trainingDataSize: '',
};

const GRADIENT = ['#efefef', '#aa815d'];
const datasetNameHash: any = {
  mnist: 'MNIST',
  face: 'Face Mask',
  anime: 'Anime',
  cifar10: 'CIFAR-10',
};

const labelDescriptionHash: any = {
  mnist: 'The value of the handwritten digit.',
  face: 'Whether the person is wearing a mask?',
  anime: 'Whether the person is interested in the game genre animes?',
  cifar10: '.........',
};

const labelNames: any = {
  mnist: [
    'digit-0',
    'digit-1',
    'digit-2',
    'digit-3',
    'digit-4',
    'digit-5',
    'digit-6',
    'digit-7',
    'digit-8',
    'digit-9',
  ],
  face: ['With mask', 'With no mask'],
  cifar10: ['plane', 'car', 'ship', 'truck'],
};

function LeftPanel() {
  const [index, setIndex] = useState(-1);

  // overview显示的范围（数组下标)
  const [range, setRange] = useState<number[]>([0, 1]);

  const dispatch = useDispatch();
  const updateName = useCallback((n) => dispatch(setNameAction(n)), [dispatch]);
  // const [round, setRound] = useState<number>(121);
  // weights接口的数据
  const [rawWeights, setRawWeights] = useState<any>(null);
  const round = useSelector((state: StateType) => state.basic.round);
  const dataSize = useSelector((state: StateType) => state.basic.dataSize);

  // client Names
  const [names, setClientNames] = useState<string[]>([]);
  // datasetNames
  const [datasets, setDatasets] = useState<string[]>([]);
  const [datasetIndex, setDatasetIndex] = useState<number>(-1);

  const [info, setInfo] = useState<Info>(initInfo);

  const [layerItem, setLayerItems] = useState<string[]>([]);
  // Overview选哪一层
  const [layerIndex, setLayerIndex] = useState<number>(0);
  const onLayerChange = useCallback((i) => {
    setLayerIndex(i);
  }, []);

  const initBasic = useCallback(() => dispatch(initBasicData()), [dispatch]);
  const initIdentity = useCallback(() => dispatch(initIdentityAction()), [dispatch]);

  const setLevel = useCallback((level: number) => dispatch(setLevelAction(level)), [dispatch]);
  const level = useSelector((state: StateType) => state.service.level);
  const setRound = useCallback((i) => dispatch(setRoundAction(i)), [dispatch]);
  const onTypeUpdateOrInit = useCallback(
    (type: string, r: number) =>
      dispatch(onTypeUpdateOrInitAction(type, r, null, null, null, null)),
    [dispatch]
  );
  const setLabelNames = useCallback((n: string[]) => dispatch(setLabelNamesAction(n)), [dispatch]);

  // 修改client
  const onDropdownChange = (i: any) => {
    setIndex(i);
    // console.log('test')
    // if (index !== -1) {

    // }
  };

  const onDatasetChange = (i: any) => {
    setDatasetIndex(i);
    setIndex(-1);
    initBasic();
    initIdentity();
    setRound(0);
    setLevel(HTTP_LEVEL.client);
    setRawWeights(null);

    fetch('/fl-hetero/datasets/', {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        datasetName: datasets[i],
        // datasetName: datasetNames,
      }),
    })
      .then((res2) => res2.json())
      .then((res2) => {
        const {
          clientNames,
          communicationRounds,
          dimensions,
          // labelDescription: labels,
          numberOfClients,
          testDataSize,
          trainingDataSize,
          type,
        } = res2;

        setClientNames(clientNames);

        setInfo({
          labels: labelDescriptionHash[datasets[i]],
          communicationRounds,
          dimensions: dimensions.join('x'),
          numberOfClients,
          testDataSize,
          trainingDataSize,
        });

        setDatasetInfo(
          type,
          dimensions.slice(-2).reduce((acc: number, cur: number) => acc * cur, 1)
        );

        setLabelNames(labelNames[datasets[i]]);
        // setLevel(HTTP_LEVEL.datasets+1);
      });
  };

  useEffect(() => {
    setLabelNames(labelNames[datasets[datasetIndex]]);
  }, [datasetIndex, datasets, index, setLabelNames]);

  useEffect(() => {
    fetch('/fl-hetero/datasets/')
      .then((res) => res.json())
      .then((res) => {
        // console.log(res);
        // 当前只有一个数据集
        const { datasetNames } = res;
        setDatasets(datasetNames);
      });
  }, []);

  useEffect(() => {
    console.log(level);
    if (index !== -1 && level === HTTP_LEVEL.weights) {
      fetch('/fl-hetero/weights/')
        .then((res) => res.json())
        .then((res) => {
          setRawWeights(res);
          setRange([0, res.serverWeights[0].length - 1]);
          setRound(res.serverWeights[0].length - 1);
          setLevel(HTTP_LEVEL.sampling);
          setLayerItems(res.layerNames);
        });
    }
  }, [index, level, setLevel, setRound]);

  useEffect(() => {
    if (HTTP_LEVEL.sampling === level && round !== -1) {
      onTypeUpdateOrInit(getType(), round);
    }
  }, [level, onTypeUpdateOrInit, rawWeights, round, setRound]);

  useEffect(() => {
    if (names[index]) {
      updateName(names[index]);
    }
  }, [index, initBasic, initIdentity, names, setRound, updateName]);

  const overviewData: OverviewData = useMemo(() => {
    if (rawWeights === null) {
      return fakeData;
    }
    const { serverWeights, clientWeights, cosines, weight0 } = rawWeights;
    return {
      server: serverWeights[layerIndex].filter(
        (d: any, i: number) => i >= range[0] && i <= range[1]
      ),
      local: clientWeights[layerIndex].filter(
        (d: any, i: number) => i >= range[0] && i <= range[1]
      ),
      cosines: cosines[layerIndex].filter((d: any, i: number) => i >= range[0] && i <= range[1]),
      weight0: range[0] === 0 ? weight0[layerIndex] : serverWeights[layerIndex][range[0] - 1],
    };
  }, [layerIndex, range, rawWeights]);

  const cosineExtent = useMemo(() => {
    // 从最大到最小
    if (rawWeights) {
      return [1, +(Math.floor(Math.min(...rawWeights.cosines[layerIndex]) * 100) / 100).toFixed(2)];
      // return extent
    }
    return [1, -1];
  }, [layerIndex, rawWeights]);

  return (
    <div id="LeftPanel" className="panel">
      <h2>FL Process Monitor</h2>

      <div className="content">
        <div className="info-container">
          <h3>Model Information</h3>
          {/* <p className='title'>Model Information Panel</p> */}
          <div>
            <div className="info-row">
              <span>Name of dataset: </span>
              <Dropdown
                items={datasets.map((d: string) => datasetNameHash[d])}
                setIndex={onDatasetChange}
                index={datasetIndex}
              />
            </div>
            <p>Label: {info.labels} </p>
            <p>#Dimensions: {info.dimensions}</p>
            <p>#Clients: {info.numberOfClients} </p>
            <p>Current communication round: {info.communicationRounds}</p>
          </div>

          <div id="info-two">
            {/* <p className='title'>Local Information Panel</p> */}
            <h3>Local Information</h3>

            <div className="info-row">
              <span>Name of this client: </span>
              <Dropdown items={names} setIndex={onDropdownChange} index={index} />
            </div>
            <p>Size of the local data: </p>
            <p>{dataSize.trainSize || ''} records in the training set</p>
            <p>{dataSize.testSize || ''} records in the test set</p>
          </div>
        </div>

        <div className="overview-wrapper">
          <div className="dashed-divider" />

          <h3>Parameter Projection</h3>
          <div className="overview-content">
            <div className="info">
              <p>Communication round range:</p>
              <RangeSlider
                range={range}
                setRange={setRange}
                extent={rawWeights !== null ? rawWeights.serverWeights[0].length : range[1] + 1}
              />

              <div className="row layer-select">
                <p>Layer in the neural network: </p>
                <Dropdown items={layerItem} setIndex={onLayerChange} index={layerIndex} />
              </div>

              <div>
                <svg height="20px" viewBox="0 0 300 20">
                  <circle cx="8" cy="10" r="2.6" stroke="#000" fill="#fff" />
                  <text x="20" y="15">
                    Selected communication round
                  </text>
                </svg>
              </div>
              <div>
                <svg height="20px" viewBox="0 0 200 20">
                  <defs>
                    <marker
                      id="arrow-tip"
                      refX="6 "
                      refY="6"
                      viewBox="0 0 16 16"
                      markerWidth="8"
                      markerHeight="8"
                      markerUnits="userSpaceOnUse"
                      orient="auto"
                    >
                      <path d="M 0 0 12 6 0 12 3 6 Z" fill="var(--primary-color)" />
                    </marker>
                  </defs>
                  <line
                    x1="0"
                    y1="10"
                    x2="10"
                    y2="10"
                    stroke="var(--primary-color)"
                    markerEnd="url(#arrow-tip)"
                  />
                  <text x="20" y="15">
                    Local parameter updates
                  </text>
                </svg>
              </div>

              <div className="row">
                {/* <p>Update disagreement (Cosine) :</p> */}
                <p>Disagreement (cosine) :</p>
                <div className="cosine-legend">
                  <Gradient
                    colors={GRADIENT}
                    legends={[`${cosineExtent[0]}`, `${cosineExtent[1]}`]}
                    width="90px"
                  />
                </div>
              </div>
            </div>

            <Overview
              data={overviewData}
              flag={range[0] === 0}
              round={round - range[0]}
              colorExtent={cosineExtent}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

export default LeftPanel;
