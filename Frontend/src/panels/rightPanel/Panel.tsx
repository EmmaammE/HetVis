/* eslint-disable no-case-declarations */
/* eslint-disable jsx-a11y/no-static-element-interactions */
/* eslint-disable jsx-a11y/click-events-have-key-events */
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import * as d3 from 'd3';
import { setIndexAction } from '../../store/reducers/blockIndex';
import CpLineChart from '../../components/lineChart/CpLineChart';
import GridMatrix from '../../components/PairRect.tsx/GridMatrix';
import './RightPanel.scss';
import Dropdown from '../../components/ui/Dropdown';
import PairRect from '../../components/PairRect.tsx/PairRect';
import { StateType } from '../../types/data';
import Gradient from '../../components/ui/Gradient';
import inputStyles from '../../styles/input.module.css';
import { fetchLists, setPropertyAction } from '../../store/reducers/basic';
import Icon from '../../components/ui/JoinIcon';
import {
  setLevelAction,
  setChosePointAction,
  defaultAlpha,
  getCPCA,
  getGradImages,
} from '../../store/reducers/service';
import HTTP_LEVEL from '../../utils/level';
import PureRect from '../../components/PairRect.tsx/PureRect';
import { getDatasetInfo } from '../../utils/getType';
import useFetch from '../../utils/useFetch';
import usePrevious from '../../utils/usePrevious';
import IconUrl from '../../components/ui/getIcon';

const margin = { t: 20, r: 20, b: 35, l: 55 };
const WIDTH = 25;

const RECTS_TITLE = [
  ['cPC1', 'cPC2'],
  ['Stand-alone training model', 'Federated learning model'],
];
const areEqual = (first: number[], second: number[]) => {
  if (first.length !== second.length) {
    return false;
  }
  for (let i = 0; i < first.length; i++) {
    // 因为都是从points中加载的，所以如果相同, 顺序一定一样
    // if (!second.includes(first[i])) {
    //   return false;
    // }
    if (second[i] !== first[i]) {
      return false;
    }
  }
  return true;
};

function RightPanel() {
  const index: number = useSelector((state: StateType) => state.blockIndex);
  const heteroList = useSelector((state: StateType) => state.service.heteroList.clusterList);
  const localData = useSelector((state: StateType) => state.service.localData);
  const heteroLabels = useSelector((state: StateType) => state.service.heteroLabels);
  const outputLabels = useSelector((state: StateType) => state.service.outputLabels);
  const groundTruth = useSelector((state: StateType) => state.service.groundTruth);

  const localLabels = useSelector((state: StateType) => state.service.localOutputLabel);

  const propertyIndex = useSelector((state: StateType) => state.basic.propertyIndex);
  const labelNames = useSelector((state: StateType) => state.basic.labelNames);

  const dispatch = useDispatch();
  // const setIndex = useCallback((i) => dispatch(setIndexAction(i)), [dispatch]);

  const getList = useCallback(() => dispatch(fetchLists()), [dispatch]);

  const [heteData, setHeteData] = useState<any>(null);

  // const [pcArr, setcPCA] = useState([[], []]);
  const pcArr = useSelector((state: StateType) => state.service.cpca.tensor);

  const [annoText, setAnnoText] = useState<string>('');

  const round = useSelector((state: StateType) => state.basic.round);

  const pos = useSelector((state: StateType) => state.basic.pos);

  const annoList = useSelector((state: StateType) => state.basic.annoLists);
  const [chosedAnnList, setChoseAnnList] = useState<Set<number>>(new Set());

  const [param, setParam] = useState<number>(defaultAlpha);
  const cpacaAlphaFromStore = useSelector((state: StateType) => state.service.cpca.alpha);

  const [annoListStatus, setAnnoListStatus] = useState<number[]>([]);

  const setLevel = useCallback((level: number) => dispatch(setLevelAction(level)), [dispatch]);
  // const level = useSelector((state: StateType) => state.service.level);

  const [strokeStatus, setStrokeStatus] = useState(0);
  const [strokeId, setStrokeId] = useState(-1);

  const updatePropertyIndex = useCallback((i) => dispatch(setPropertyAction(i)), [dispatch]);

  // const [chosePoint, setChosePoint] = useState<number>(-1);
  const chosePoint = useSelector((state: StateType) => state.service.chosePoint);
  const setChosePoint = useCallback((i) => dispatch(setChosePointAction(i)), [dispatch]);
  const updateCPCA = useCallback(
    (dataIndex: number[], alpha: number | null) => dispatch(getCPCA(dataIndex, alpha)),
    [dispatch]
  );
  const updateGradImages = useCallback(
    (dataIndex: number[]) => dispatch(getGradImages(dataIndex)),
    [dispatch]
  );
  const gradImages = useSelector((state: StateType) => state.service.gradImages);
  // 点击格子之后，请求cpca的点的坐标
  const [blockIndex, setBlockIndex] = useState<number[]>([]);

  // 做完集合操作以后的点的下标
  const [strokePoints, setStrokePoints] = useState<number[]>([]);
  const [lineIndex, setLineIndex] = useState<number>(0);
  const [typeIndex, setTypeIndex] = useState<number>(0);
  const [channelIndex, setChannelIndex] = useState<number>(0);

  // { dimIndex: number}
  const { data: attribute, setRequest: setAttribte } = useFetch('/fl-hetero/attribute/', null);
  // { "dataIndex": number,  }
  const { data: instance, setRequest: setInstance } = useFetch('/fl-hetero/instance/', null);

  const [dimensionTypeIndex, setDimensionType] = useState(0);

  const { dimension } = getDatasetInfo();

  const [layerIndex, setLayerIndex] = useState<number>(1);

  // useEffect(() => {
  //   if (gradImages[0].length > 0) {
  //     setLayerIndex(gradImages[0].length - 1);
  //   }
  // }, [gradImages]);

  const onChangeDimensionType = (i: number) => {
    setDimensionType(i);
    if (i === 1) {
      if (blockIndex.length > 0) {
        updateGradImages(blockIndex);
      } else if (heteroList[index]) {
        updateGradImages(heteroList[index].heteroIndex);
      }
    }
  };

  useEffect(() => {
    setDimensionType(0);
  }, [blockIndex]);

  useEffect(() => {
    if (propertyIndex !== -1) {
      setAttribte({
        dimIndex: propertyIndex + dimension * channelIndex,
      });
    }
  }, [channelIndex, dimension, propertyIndex, setAttribte]);

  useEffect(() => {
    if (blockIndex.length > 0) {
      setChosePoint(blockIndex[0]);
    }
  }, [blockIndex, setChosePoint]);

  useEffect(() => {
    if (chosePoint !== -1) {
      setInstance({
        dataIndex: chosePoint,
      });
    }
  }, [chosePoint, setInstance]);

  const setPoints = useCallback(
    (p: any) => {
      if (!areEqual(p, strokePoints)) {
        setStrokePoints(p);
      }
    },
    [strokePoints]
  );

  useEffect(() => {
    // 每次标注列表更新，更新状态
    if (annoListStatus.length !== annoList.length) {
      const newStatusArr = Array.from({ length: annoList.length }, (d, i) => {
        if (annoListStatus[i]) {
          return annoListStatus[i];
        }
        return 0;
      });

      setAnnoListStatus(newStatusArr);
    }
  }, [annoList, annoListStatus]);

  const previousRound = usePrevious(round);

  useEffect(() => {
    if (round !== previousRound) {
      setAnnoListStatus(Array.from({ length: annoList.length }, () => 0));
      setStrokeId(-1);
    }
  }, [annoList.length, previousRound, round]);

  const addAnn = () => {
    fetch('/fl-hetero/annotation/', {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        command: 'add',
        dataIndex: strokePoints,
        text: annoText,
      }),
    }).then(() => {
      // console.log(res);
      getList();
      setAnnoText('');
    });
  };

  const handleInput = (e: any) => {
    setAnnoText(e.target.value);
  };

  const lineDatum = useMemo(() => {
    // 一致的点，不一致的点
    const temp: number[][] = [[], []];
    const tempHeteData: number[] = [];

    if (typeIndex === 1) {
      const pointsIndex =
        // eslint-disable-next-line no-nested-ternary
        blockIndex.length > 0 ? blockIndex : heteroList[index] ? heteroList[index].heteroIndex : [];
      pointsIndex.forEach((heteroIndex) => {
        const d = attribute[heteroIndex];
        // 如果不一致
        if (heteroLabels[heteroIndex] === false) {
          temp[1].push(d);
        } else {
          temp[0].push(d);
        }
        tempHeteData.push(d);

        setHeteData(tempHeteData);
      });
    } else {
      attribute.forEach((d, i) => {
        // 如果不一致
        if (heteroLabels[i] === false) {
          temp[1].push(d);
        } else {
          temp[0].push(d);
        }
        tempHeteData.push(d);

        setHeteData(tempHeteData);
      });
    }

    return temp;
  }, [attribute, blockIndex, heteroLabels, heteroList, index, typeIndex]);

  const handleHover = useCallback(
    (id: number) => {
      if (annoList[id]) {
        setChoseAnnList(new Set(annoList[id].dataIndex));
      }
    },
    [annoList]
  );

  const handleOut = useCallback(() => {
    setChoseAnnList(new Set());
  }, []);

  const handleChange = (id: number) => {
    const tmp = [...annoListStatus];
    const updateStatus = (annoListStatus[id] + 1) % 3;
    tmp[id] = updateStatus;

    setAnnoListStatus(tmp);
    setStrokeStatus(updateStatus);
    setStrokeId(id);
  };

  // 选择的注释的点的
  const strokeSet: Set<number> = useMemo(() => {
    if (annoList[strokeId]) {
      let set = new Set<number>(annoList[strokeId].dataIndex);
      annoListStatus.forEach((d, i) => {
        if (d !== 0 && i !== strokeId) {
          if (d === 1) {
            set = new Set([...Array.from(set), ...annoList[i].dataIndex]);
          } else if (d === 2) {
            annoList[i].dataIndex.forEach((j: number) => {
              set.add(j);
            });
          }
        }
      });
      return set;
    }
    return new Set<number>();
  }, [annoList, strokeId, annoListStatus]);

  const [alphaIconStatus, setAlphaIconStatus] = useState<0 | 1>(0);
  const $inputAlpha = useRef(null);

  useEffect(() => {
    setAlphaIconStatus(0);
  }, [heteroList, blockIndex]);

  const handleParamChange = useCallback(
    (e: any) => {
      const value = +e.target.value;
      if (value !== cpacaAlphaFromStore) {
        if (blockIndex.length > 0) {
          updateCPCA(blockIndex, value);
        } else {
          updateCPCA(heteroList[index].heteroIndex, value);
        }
        setLevel(HTTP_LEVEL.cpca);
        if (alphaIconStatus === 1) {
          setAlphaIconStatus(0);
        }
      }
    },
    [alphaIconStatus, blockIndex, cpacaAlphaFromStore, heteroList, index, setLevel, updateCPCA]
  );

  const freshCount = useCallback(() => {
    if (blockIndex.length > 0) {
      updateCPCA(blockIndex, null);
    } else if (heteroList[index]) {
      updateCPCA(heteroList[index].heteroIndex, null);
    }

    setAlphaIconStatus(1);
  }, [blockIndex, heteroList, index, updateCPCA]);

  useEffect(() => {
    setParam(cpacaAlphaFromStore);
    ($inputAlpha as any).current.value = cpacaAlphaFromStore.toFixed(2);
  }, [cpacaAlphaFromStore]);

  const { truth, output, client } = useMemo(() => {
    if (chosePoint === -1) {
      return {
        truth: '',
        output: '',
        client: '',
      };
    }
    return {
      truth: labelNames[groundTruth[chosePoint]],
      output: labelNames[outputLabels[chosePoint]],
      client: labelNames[localLabels[chosePoint]],
    };
  }, [chosePoint, groundTruth, labelNames, localLabels, outputLabels]);

  const showPC = useMemo(() => {
    if (dimensionTypeIndex === 0) {
      return pcArr;
    }
    if (gradImages[0].length === 0) {
      return [[], []];
    }
    return gradImages.map((arr) => arr[layerIndex]);
  }, [dimensionTypeIndex, gradImages, layerIndex, pcArr]);

  const colorScale = useMemo(() => {
    if (dimensionTypeIndex === 0) {
      const extent: number =
        pcArr[0].length > 0
          ? Math.max(
              Math.abs(Math.min(...pcArr[0], ...pcArr[1])),
              Math.abs(Math.max(...pcArr[0], ...pcArr[1]))
            )
          : 1;
      return d3
        .scaleLinear<string, number>()
        .domain([-extent, 0, extent])
        .range(['#c21317', '#fff', '#1365c2'])
        .nice();
    }

    // d3.interpolateWarm
    const value = gradImages[0].length > 0 ? Math.max(...showPC[0], ...showPC[1]) : 1;
    return (
      d3
        .scaleLinear<string, number>()
        .domain([0, value * 0.8, value])
        // .range([ '#fff', '#1365c2'])
        // .range(['#ea6a00','#ffff69', '#fff'])
        .range(['#463f7c', '#cbefea', '#efefef'])
        .nice()
    );
  }, [dimensionTypeIndex, gradImages, pcArr, showPC]);

  useEffect(() => {
    let defaultIndex = -1;
    let maxV = Number.MIN_VALUE;

    const count = dimensionTypeIndex === 0 ? channelIndex * dimension : 0;
    for (let i = 0; i < dimension; i++) {
      const v = Math.max(showPC[0][i + count]) + Math.max(showPC[1][i + count]);

      if (maxV < v) {
        maxV = v;
        defaultIndex = i;
      }
    }

    updatePropertyIndex(defaultIndex);
  }, [channelIndex, dimension, dimensionTypeIndex, pcArr, showPC, updatePropertyIndex]);

  return (
    <div className="panel" id="RightPanel">
      <h2>Heterogenity Examination</h2>
      <div className="content">
        <div className="weight-rects r-panel">
          <div className="row">
            <div className="row left-info">
              <span>Navigated by: </span>
              <Dropdown
                items={['ccPCA', 'Grad-CAM ']}
                setIndex={onChangeDimensionType}
                index={dimensionTypeIndex}
              />
            </div>

            {
              dimensionTypeIndex === 0 && (
                <div className="row" style={{ transition: 'all 300ms ease-in-out' }}>
                  <p className="label">Contrastive parameter: </p>
                  <div className={inputStyles.wrapper}>
                    <input
                      className={inputStyles.input}
                      type="text"
                      defaultValue={param?.toFixed(2)}
                      onBlur={handleParamChange}
                      ref={$inputAlpha}
                    />
                    <span className={inputStyles.icon} onClick={freshCount}>
                      <img src={IconUrl[alphaIconStatus]} alt="refresh" />
                    </span>
                  </div>
                </div>
              )
              // <div
              //   className="row"
              //   style={{ transition: 'all 300ms ease-in-out',}}
              // >
              //   <p className="label">Layer: </p>
              //   <Dropdown
              //     items={Array.from({length: gradImages[0].length}, (d, i) => i)}
              //     index={layerIndex}
              //     setIndex={setLayerIndex}
              //   />
              // </div>
            }
          </div>

          <div className="row">
            <div className="row left-info">
              <span>Weights:</span>
              <Gradient
                colors={colorScale.range() as string[]}
                legends={[colorScale.domain()[0], colorScale.domain()[2]]}
                width="80"
                ratio={dimensionTypeIndex === 1 ? ['0%', '80%', '100%'] : ['0%', '50%', '100%']}
              />
            </div>

            <div className="rgb-values" style={{ opacity: dimension < pcArr[0].length ? 1 : 0 }}>
              <span
                onClick={() => setChannelIndex(0)}
                style={{ border: channelIndex === 0 ? '2px solid #aaa' : '2px solid #fff' }}
              >
                R
              </span>
              <span
                onClick={() => setChannelIndex(1)}
                style={{ border: channelIndex === 1 ? '2px solid #aaa' : '2px solid #fff' }}
              >
                G
              </span>
              <span
                onClick={() => setChannelIndex(2)}
                style={{ border: channelIndex === 2 ? '2px solid #aaa' : '2px solid #fff' }}
              >
                B
              </span>
            </div>
          </div>

          <div className="pair-rects">
            {showPC[0].length > 0 &&
              showPC.map((pc, i) => (
                <PairRect
                  key={i}
                  data={pc}
                  title={RECTS_TITLE[dimensionTypeIndex][i]}
                  color={colorScale}
                  channel={dimensionTypeIndex === 0 ? channelIndex : 0}
                />
              ))}
          </div>
        </div>

        <div className="attr-container r-panel">
          <div className="row">
            <p>
              Dimension: pixel ({pos.join(', ')})
              {dimension < pcArr[0].length ? [' - R', ' - G', ' - B'][channelIndex] : ''}
            </p>

            <div className="info">
              <span>Scope:</span>
              <Dropdown items={['All', 'Cluster']} index={typeIndex} setIndex={setTypeIndex} />
            </div>

            <div className="info">
              <span>y-scale:</span>
              <Dropdown items={['Linear', 'Log']} index={+lineIndex} setIndex={setLineIndex} />
            </div>
          </div>

          <div className="row svg-legends">
            <svg height="22px" viewBox="0 0 95 20">
              <line x1="0" y1="10" x2={WIDTH} y2="10" stroke="#b6b6b6" />
              <text x={WIDTH + 3} y="15">
                Consistent
              </text>
            </svg>

            <svg height="22px" viewBox="0 0 105 20">
              <line x1="0" y1="10" x2={WIDTH} y2="10" stroke="var(--primary-color)" />
              <text x={WIDTH + 3} y="15">
                Inconsistent
              </text>
            </svg>

            <svg height="22px" viewBox="0 0 60 20">
              <line x1="0" y1="10" x2={WIDTH} y2="10" stroke="#c04548" />
              <text x={WIDTH + 3} y="15">
                Total
              </text>
            </svg>
          </div>

          <div className="lines-container">
            <div className="lines">
              {heteData && (
                <CpLineChart
                  margin={margin}
                  data={lineDatum}
                  title=""
                  index={+lineIndex}
                  hetData={heteData}
                  typeIndex={typeIndex}
                />
              )}
            </div>
          </div>
        </div>

        <div className="grid-wrapper r-panel">
          <GridMatrix
            data={localData}
            xLabels={groundTruth}
            yLabels={outputLabels}
            highlight={chosedAnnList}
            heteroIndex={heteroList[index] ? new Set(heteroList[index].heteroIndex) : new Set()}
            heteroLabels={heteroLabels}
            strokeSet={strokeSet}
            strokeStatus={strokeStatus}
            chosePoint={chosePoint}
            setChosePoint={setChosePoint}
            setStrokePoints={setPoints}
            gridPointsIndex={blockIndex}
            setBlockIndex={setBlockIndex}
          />
        </div>

        <div className="op-container r-panel" id="anno-panel">
          <p className="title">Instance Verification</p>
          <div className="lists instance-panel">
            <div id="data-wrapper">
              <p>Data:</p>
              {/* <PureRect data={chosePoint !== -1 ? samplesByRange[chosePoint] : []} /> */}
              <PureRect data={instance || []} />
            </div>
            <div>
              <p>Ground-truth label: </p>
              <p>&emsp;{truth}</p>
              <p>Output:</p>
              <p className={['item', output === truth ? 'item-tick' : 'item-cross'].join(' ')}>
                Federated learning model:
              </p>
              <p>&emsp;{output}</p>
              <p className={['item', client === truth ? 'item-tick' : 'item-cross'].join(' ')}>
                Stand-alone training model:
              </p>
              <p>&emsp;{client}</p>
            </div>
          </div>
        </div>

        <div className="op-container r-panel" id="control-panel">
          <p className="title">Control Panel</p>
          <div className="lists">
            <div className="list-content">
              <div className="row">
                <p>Overlap lists:</p>
                <p>#Selected records: {strokePoints.length}</p>
              </div>

              <div className="list-area">
                {annoList.map(({ round: r, text, dataIndex }, i) => (
                  <div
                    className="list-item"
                    key={i}
                    data-id={i}
                    onClick={() => handleChange(i)}
                    onMouseOver={() => handleHover(i)}
                    onFocus={() => handleHover(i)}
                    onMouseOut={handleOut}
                    onBlur={handleOut}
                  >
                    <span
                      className="img-wrapper"
                      style={{ pointerEvents: 'none', cursor: 'pointer' }}
                    >
                      <Icon status={annoListStatus[i]} id={i} />
                    </span>

                    <div style={{ pointerEvents: 'none' }}>
                      <p>
                        In round {r + 1} (size: {dataIndex.length}){' '}
                      </p>
                      <p className="anno">{text}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div id="input-wrapper">
              <textarea placeholder="Input" value={annoText} onInput={handleInput} />
              <div className="btn-area">
                <button type="button" className="c-btn" onClick={addAnn}>
                  Record
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default RightPanel;
