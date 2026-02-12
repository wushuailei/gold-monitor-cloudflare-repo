import { useEffect, useRef } from "react";
import { createChart, ColorType, IChartApi, ISeriesApi, Time, LineSeries } from "lightweight-charts";
import { PricePoint, Trade, UserConfig } from "../types";

interface GoldChartProps {
  data: PricePoint[];
  trades: Trade[];
  configs: UserConfig[];
  onChartClick?: (param: any) => void;
}

export function GoldChart({ data, trades, configs, onChartClick }: GoldChartProps) {
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const seriesRef = useRef<ISeriesApi<"Line"> | null>(null);

  useEffect(() => {
    if (!chartContainerRef.current) return;

    const chart = createChart(chartContainerRef.current, {
      layout: {
        background: { type: ColorType.Solid, color: "#FFFFFF" },
        textColor: "#6B7280",
      },
      grid: {
        vertLines: { color: "#F3F4F6" },
        horzLines: { color: "#F3F4F6" },
      },
      width: chartContainerRef.current.clientWidth,
      height: 450,
      timeScale: {
        timeVisible: true,
        secondsVisible: false,
        borderColor: "#E5E7EB",
      },
      rightPriceScale: {
        borderColor: "#E5E7EB",
      },
    });

    const lineSeries = chart.addSeries(LineSeries, {
      color: "#F59E0B",
      lineWidth: 2.5,
      lastValueVisible: true,
      priceLineVisible: true,
    });

    chartRef.current = chart;
    seriesRef.current = lineSeries;

    if (onChartClick) {
        chart.subscribeClick(onChartClick);
    }

    const handleResize = () => {
      if (chartContainerRef.current) {
        chart.applyOptions({ width: chartContainerRef.current.clientWidth });
      }
    };

    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
      if (onChartClick) {
          chart.unsubscribeClick(onChartClick);
      }
      chart.remove();
    };
  }, []);

  useEffect(() => {
    if (!seriesRef.current || data.length === 0) return;

    const formattedData = data
        .map((d) => ({
            time: d.ts as Time,
            value: d.price,
        }))
        .sort((a, b) => (a.time as number) - (b.time as number));

    seriesRef.current.setData(formattedData);

    // Markers for Trades
    const markers: any[] = [];
    trades.forEach((t) => {
      markers.push({
        time: t.ts as Time,
        position: t.side === "买" ? "belowBar" : "aboveBar",
        color: t.side === "买" ? "#10B981" : "#EF4444",
        shape: t.side === "买" ? "arrowUp" : "arrowDown",
        text: `${t.side} @ ¥${t.price.toFixed(2)}`,
      });
    });
    
    if ((seriesRef.current as any).setMarkers) {
        (seriesRef.current as any).setMarkers(markers);
    }
  }, [data, trades]);

  // Handle Target Price Lines
  const priceLinesRef = useRef<any[]>([]);

  useEffect(() => {
      if (!seriesRef.current) return;
      
      // Clear existing
      priceLinesRef.current.forEach(line => seriesRef.current?.removePriceLine(line));
      priceLinesRef.current = [];

      configs.forEach(config => {
          if (config.target_alert !== 1 || !config.target_price) return;
          
          const isAbove = config.target_cmp === 'GTE';
          const isBelow = config.target_cmp === 'LTE';
          const isEqual = config.target_cmp === 'EQ';
          
          const line = seriesRef.current?.createPriceLine({
              price: config.target_price,
              color: isAbove ? '#3B82F6' : isBelow ? '#F97316' : '#8B5CF6',
              lineWidth: 2,
              lineStyle: 2, // Dashed
              axisLabelVisible: true,
              title: `${isAbove ? '突破' : isBelow ? '跌破' : '到达'} ¥${config.target_price.toFixed(2)}`,
          });
          if (line) priceLinesRef.current.push(line);
      });

  }, [configs]);

  return <div ref={chartContainerRef} className="w-full h-[450px]" />;
}
