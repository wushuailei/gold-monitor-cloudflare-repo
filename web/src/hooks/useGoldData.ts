import { useState, useEffect } from "react";
import { api, GlobalConfig, UserTarget } from "../lib/api";
import { PricePoint, Trade, Report, Alert, UserConfig, DailyPrice } from "../types";

interface Holding {
  symbol: string;
  total_qty: number;
  total_cost: number;
  avg_price: number;
  realized_profit: number;
  updated_ts: number;
}

export function useGoldData(
  chartHours: number,
  dailyDays: number,
  tradeDays: number,
  alertDays: number,
  reportDays: number
) {
  const [prices, setPrices] = useState<PricePoint[]>([]);
  const [dailyPrices, setDailyPrices] = useState<DailyPrice[]>([]);
  const [trades, setTrades] = useState<Trade[]>([]);
  const [reports, setReports] = useState<Report[]>([]);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [configs, setConfigs] = useState<UserConfig[]>([]);
  const [globalConfig, setGlobalConfig] = useState<GlobalConfig | null>(null);
  const [userTargets, setUserTargets] = useState<UserTarget[]>([]);
  const [holdings, setHoldings] = useState<Holding | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [
        priceData,
        dailyData,
        tradeData,
        reportData,
        alertData,
        configData,
        globalConfigData,
        userTargetsData,
        holdingsData,
      ] = await Promise.all([
        api.getPrices(chartHours),
        api.getDailyPrices(dailyDays),
        api.getTrades(tradeDays),
        api.getReports(reportDays),
        api.getAlerts(alertDays),
        api.getTargets(),
        api.getGlobalConfig(),
        api.getUserTargets(),
        api.getHoldings(),
      ]);
      setPrices(priceData);
      setDailyPrices(dailyData);
      setTrades(tradeData);
      setReports(reportData);
      setAlerts(alertData);
      setConfigs(configData);
      setGlobalConfig(globalConfigData);
      setUserTargets(userTargetsData);
      setHoldings(holdingsData);
    } catch (err) {
      console.error("Failed to fetch data:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [chartHours, dailyDays, tradeDays, alertDays, reportDays]);

  return {
    prices,
    dailyPrices,
    trades,
    reports,
    alerts,
    configs,
    globalConfig,
    userTargets,
    holdings,
    loading,
    refetch: fetchData,
  };
}

export type { Holding };
