import { Box, Text } from "@chakra-ui/react";
import randomColor from "randomcolor";
import React, { ReactNode, useMemo, useState } from "react";
import {
  Bar,
  BarChart,
  Cell,
  LabelList,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Sector,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  NameType,
  ValueType,
} from "recharts/types/component/DefaultTooltipContent";
import { ContentType } from "recharts/types/component/Tooltip";

export interface WidgetProps<T> {
  title: string;
  component?: React.FC<{ value?: T }>;
  data?: T;
  singleColor?: boolean;
  width?: number;
  height?: number;
}

const colors = [
  "#2f4b7c",
  "#f95d6a",
  "#003f5c",
  "#ff7c43",
  "#665191",
  "#ffa600",
  "#b33dc6",
  "#f46a9b",
  "#d45087",
];

const BAR_WIDTH = 48;

function Widget<T extends ReactNode>({
  title,
  component: Component = PlainTextWidget<T>,
  data,
  width,
  height,
  singleColor = true,
}: WidgetProps<T>) {
  const widgetColor = useMemo(
    () => (singleColor ? "#bdc3c7" : randomColor({ luminosity: "light" })),
    []
  );

  return (
    <Box
      display="flex"
      flexDirection="column"
      alignItems="center"
      justifyContent="space-between"
      gap={4}
      background={widgetColor}
      borderRadius={4}
      paddingX={12}
      paddingY={4}
    >
      <Box flexGrow={1} width={width} height={height}>
        <Component value={data} />
      </Box>
      <Text
        flexGrow={0}
        textAlign="center"
        fontWeight="bold"
        color="#2c3e50"
        width="100%"
      >
        {title}
      </Text>
    </Box>
  );
}

const CustomTooltip: ContentType<ValueType, NameType> = (props) => {
  const { active, payload } = props;
  if (active && payload && payload.length) {
    console.log(payload);
    return (
      <Box width={40} bg="white">
        <Text
          color="black"
          className="label"
        >{`${payload[0].unit ?? ""}${payload[0].value}`}</Text>
        <p className="desc">Anything you want can be displayed here.</p>
      </Box>
    );
  }

  return null;
};

function PlainTextWidget<T extends ReactNode>({ value }: { value?: T }) {
  return value ? (
    <Text
      flexGrow={1}
      fontSize="5xl"
      textAlign="center"
      fontWeight="bold"
      color="#2c3e50"
      width="100%"
    >
      {value}
    </Text>
  ) : undefined;
}

function BarChartWidget<T extends any[]>({
  value,
  name,
  dataKey,
  unit,
  showY = true,
  format = (value) => value,
}: {
  value?: T[];
  name: string;
  dataKey: string;
  unit?: string;
  showY?: boolean;
  format?: (value: T) => ValueType;
}) {
  return value ? (
    <ResponsiveContainer height="100%" width="100%">
      <BarChart
        dataKey={dataKey}
        // width={BAR_WIDTH * 8}
        // height={300}
        data={value}
      >
        <XAxis dataKey={name} />
        {showY ? <YAxis /> : null}
        <Bar dataKey={dataKey} barSize={BAR_WIDTH}>
          <LabelList formatter={format} dataKey={dataKey} position="top" />
          {value.map((_, index) => (
            <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  ) : null;
}

function StackedBarChartWidget<T extends any[]>({
  value,
  name,
}: {
  value?: T;
  name: string;
  stacked?: boolean;
  format?: (value: T) => ValueType;
}) {
  return value ? (
    <BarChart width={BAR_WIDTH * 8} height={350} data={value}>
      <XAxis dataKey={name} />
      <YAxis />
      <Tooltip />
      <Legend />

      {Array.from(
        new Set(
          value.flatMap((item) =>
            Object.keys(item).filter((key) => key !== name)
          )
        )
      ).map((item, index) => (
        <Bar
          key={index}
          dataKey={item}
          stackId={name}
          fill={colors[index % colors.length]}
          barSize={BAR_WIDTH}
        >
          {value.map((_, cellIndex) => (
            <Cell
              key={`cell-${cellIndex}`}
              fill={colors[index % colors.length]}
            />
          ))}
        </Bar>
      ))}
    </BarChart>
  ) : null;
}

const renderActiveShape = (props: any) => {
  const RADIAN = Math.PI / 180;
  const {
    cx,
    cy,
    midAngle,
    innerRadius,
    outerRadius,
    startAngle,
    endAngle,
    fill,
    payload,
    percent,
    value,
  } = props;
  const sin = Math.sin(-RADIAN * midAngle);
  const cos = Math.cos(-RADIAN * midAngle);
  const sx = cx + (outerRadius + 10) * cos;
  const sy = cy + (outerRadius + 10) * sin;
  const mx = cx + (outerRadius + 30) * cos;
  const my = cy + (outerRadius + 30) * sin;
  const ex = mx + (cos >= 0 ? 1 : -1) * 22;
  const ey = my;
  const textAnchor = cos >= 0 ? "start" : "end";
  return (
    <g>
      <text
        fontWeight="bold"
        x={cx}
        y={cy}
        dy={8}
        textAnchor="middle"
        fill={"blaxk"}
      >
        {payload.title}
      </text>
      <Sector
        cx={cx}
        cy={cy}
        innerRadius={innerRadius}
        outerRadius={outerRadius}
        startAngle={startAngle}
        endAngle={endAngle}
        fill={fill}
      />
      <Sector
        cx={cx}
        cy={cy}
        startAngle={startAngle}
        endAngle={endAngle}
        innerRadius={outerRadius + 6}
        outerRadius={outerRadius + 10}
        fill={fill}
      />
      <path
        d={`M${sx},${sy}L${mx},${my}L${ex},${ey}`}
        stroke={fill}
        fill="none"
      />
      <circle cx={ex} cy={ey} r={2} fill={fill} stroke="none" />
      <text
        x={ex + (cos >= 0 ? 1 : -1) * 12}
        y={ey}
        textAnchor={textAnchor}
        fill={fill}
        fontWeight="bold"
      >
        {value}
      </text>
    </g>
  );
};

function PieChartWidget<T extends any[]>({ value }: { value?: T }) {
  const [activeIndex, setActiveIndex] = useState(0);
  const handleEnter = (_: any, index: number) => {
    setActiveIndex(index);
  };
  return value ? (
    <Box width={400} height={350}>
      <ResponsiveContainer width="100%" height="100%">
        <PieChart data={value}>
          <Legend
            payload={value.map((item, index) => ({
              id: item.name,
              value: `${item.title} (${item.total_units})`,
              color: colors[index % colors.length],
            }))}
          />
          <Pie
            activeIndex={activeIndex}
            activeShape={renderActiveShape}
            data={value}
            cx="50%"
            cy="50%"
            innerRadius={80}
            dataKey="total_units"
            onMouseEnter={handleEnter}
            fill="#8884d8"
          >
            {value.map((_, index) => (
              <Cell
                key={`cell-${index}`}
                fill={colors[index % colors.length]}
              />
            ))}
          </Pie>
        </PieChart>
      </ResponsiveContainer>
    </Box>
  ) : null;
}

Widget.PieChart = PieChartWidget;
Widget.BarChart = BarChartWidget;
Widget.StackedBarChart = StackedBarChartWidget;

export { Widget };
