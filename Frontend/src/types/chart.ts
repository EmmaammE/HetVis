interface AxisConfig {
  title: string,
  color: string,
  grid: boolean
}

interface MariginConfig {
  r: number,
  b: number,
  l: number,
  t: number
}

export interface ChartBasicProps {
  width: number,
  height: number,
  margin: MariginConfig
}
export interface ChartProps extends ChartBasicProps{
  yaxis: AxisConfig,
  xaxis: AxisConfig,
}
