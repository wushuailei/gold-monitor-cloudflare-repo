import { useEffect, useState } from "react";
import { api } from "../lib/api";
import { PricePoint, Trade, Report, Alert, UserConfig, DailyPrice } from "../types";
import { GoldChart } from "../components/GoldChart";
import { TradeModal } from "../components/TradeModal";
import { TargetModal } from "../components/TargetModal";
import { TestModal } from "../components/TestModal";
import { ReportList } from "../components/ReportList";
import { AlertList } from "../components/AlertList";
import { TradeList } from "../components/TradeList";
import { DailyPriceList } from "../components/DailyPriceList";
import { DateRangeSelector } from "../components/DateRangeSelector";
import { Plus, RefreshCw, TrendingUp, Bell, Coins, Send } from "lucide-react";

function App() {
  const [prices, setPrices] = useState<PricePoint[]>([]);
  const [dailyPrices, setDailyPrices] = useState<DailyPrice[]>([]);
  const [trades, setTrades] = useState<Trade[]>([]);
  const [reports, setReports] = useState<Report[]>([]);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [configs, setConfigs] = useState<UserConfig[]>([]);
  
  const [isTradeModalOpen, setIsTradeModalOpen] = useState(false);
  const [isTargetModalOpen, setIsTargetModalOpen] = useState(false);
  const [isTestModalOpen, setIsTestModalOpen] = useState(false);
  const [selectedTrade, setSelectedTrade] = useState<Partial<Trade>>({});
  
  const [loading, setLoading] = useState(true);
  
  // 时间范围选择
  const [chartHours, setChartHours] = useState(24);
  const [dailyDays, setDailyDays] = useState(7);
  const [tradeDays, setTradeDays] = useState(7);
  const [alertDays, setAlertDays] = useState(7);
  const [reportDays, setReportDays] = useState(7);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [priceData, dailyData, tradeData, reportData, alertData, configData] = await Promise.all([
        api.getPrices(chartHours),
        api.getDailyPrices(dailyDays),
        api.getTrades(tradeDays),
        api.getReports(reportDays),
        api.getAlerts(alertDays),
        api.getTargets(),
      ]);
      setPrices(priceData);
      setDailyPrices(dailyData);
      setTrades(tradeData);
      setReports(reportData);
      setAlerts(alertData);
      setConfigs(configData);
    } catch (err) {
      console.error("Failed to fetch data:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [chartHours, dailyDays, tradeDays, alertDays, reportDays]);

  const handleChartClick = (param: any) => {
    if (!param.time || !param.seriesPrices) return;
    const price = param.seriesPrices.values().next().value;
    if (price) {
        setSelectedTrade({
            ts: (param.time as number) * 1000,
            price: price,
            symbol: 'AU9999',
        });
        setIsTradeModalOpen(true);
    }
  };

  const handleTradeSubmit = async (trade: Omit<Trade, "id">) => {
    await api.createTrade(trade);
    await fetchData();
  };

  const handleTargetSubmit = async (config: Omit<UserConfig, "id" | "created_ts">) => {
    await api.createTarget(config);
    await fetchData();
  };

  const latestPrice = prices.length > 0 ? prices[prices.length - 1].price : 0;
  const latestXauPrice = prices.length > 0 ? prices[prices.length - 1].xau_price : 0;
  const prevPrice = prices.length > 1 ? prices[prices.length - 2].price : latestPrice;
  const priceChange = latestPrice - prevPrice;
  const priceChangePercent = prevPrice > 0 ? (priceChange / prevPrice) * 100 : 0;
  const highPrice = prices.length > 0 ? Math.max(...prices.map(p => p.price)) : 0;
  const lowPrice = prices.length > 0 ? Math.min(...prices.map(p => p.price)) : 0;
  const priceRange = highPrice - lowPrice;
  
  // 计算买入交易的平均价格
  const buyTrades = trades.filter(t => t.side === '买');
  const avgBuyPrice = buyTrades.length > 0 
    ? buyTrades.reduce((sum, t) => sum + t.price, 0) / buyTrades.length 
    : 0;

  return (
    <div className="min-h-screen bg-[#F5F7FA]">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-50 shadow-sm">
        <div className="max-w-[1800px] mx-auto px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center shadow-sm">
                <TrendingUp className="text-white" size={18} strokeWidth={2.5} />
              </div>
              <div>
                <h1 className="text-lg font-bold text-gray-900">黄金价格监控</h1>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-3">
             <button 
                onClick={fetchData} 
                className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
                title="刷新数据"
             >
                <RefreshCw size={18} className={loading ? "animate-spin" : ""} />
             </button>
             <button 
                onClick={() => setIsTestModalOpen(true)}
                className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors font-medium text-sm flex items-center gap-2 shadow-sm"
                title="测试发送"
             >
                <Send size={16} />
                测试发送
             </button>
             <button 
                onClick={() => setIsTargetModalOpen(true)} 
                className="px-4 py-2 bg-amber-500 text-white rounded-lg hover:bg-amber-600 transition-colors font-medium text-sm flex items-center gap-2 shadow-sm"
             >
                <Plus size={16} /> 设置目标价
             </button>
          </div>
        </div>
      </header>

      <main className="max-w-[1800px] mx-auto px-8 py-6 space-y-6">
        {/* Data Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Current Price Card */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-3">
              <div className="text-sm font-medium text-gray-500">国内金价 (AU9999)</div>
              <div className={`px-2.5 py-1 rounded-lg text-xs font-bold ${
                priceChange >= 0 
                  ? 'bg-red-100 text-red-700' 
                  : 'bg-green-100 text-green-700'
              }`}>
                {priceChange >= 0 ? '↑' : '↓'} {Math.abs(priceChangePercent).toFixed(2)}%
              </div>
            </div>
            <div className="text-4xl font-bold text-gray-900 mb-2 font-mono">
              ¥{latestPrice.toFixed(2)}
            </div>
            <div className={`text-sm font-semibold ${priceChange >= 0 ? 'text-red-600' : 'text-green-600'}`}>
              {priceChange >= 0 ? '+' : ''}{priceChange.toFixed(2)} 元/克
            </div>
            {latestXauPrice > 0 && (
              <div className="text-xs text-gray-500 mt-2">
                国际金价: ${latestXauPrice.toFixed(2)}/盎司
              </div>
            )}
          </div>

          {/* 24h High Card */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
            <div className="text-sm font-medium text-gray-500 mb-3">24小时最高</div>
            <div className="text-4xl font-bold text-gray-900 mb-2 font-mono">
              ¥{highPrice.toFixed(2)}
            </div>
            <div className="text-sm text-gray-600">
              距当前 +¥{(highPrice - latestPrice).toFixed(2)}
            </div>
          </div>

          {/* 24h Low Card */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
            <div className="text-sm font-medium text-gray-500 mb-3">24小时最低</div>
            <div className="text-4xl font-bold text-gray-900 mb-2 font-mono">
              ¥{lowPrice.toFixed(2)}
            </div>
            <div className="text-sm text-gray-600">
              距当前 -¥{(latestPrice - lowPrice).toFixed(2)}
            </div>
          </div>

          {/* 24h Range Card */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
            <div className="text-sm font-medium text-gray-500 mb-3">24小时振幅</div>
            <div className="text-4xl font-bold text-gray-900 mb-2 font-mono">
              ¥{priceRange.toFixed(2)}
            </div>
            <div className="text-sm text-gray-600">
              波动率 {((priceRange / lowPrice) * 100).toFixed(2)}%
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm font-medium text-gray-500 mb-2">活跃目标</div>
                <div className="text-3xl font-bold text-gray-900">
                  {configs.filter(c => c.target_alert === 1).length}
                </div>
              </div>
              <div className="w-12 h-12 rounded-lg bg-blue-100 flex items-center justify-center">
                <TrendingUp className="text-blue-600" size={24} />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm font-medium text-gray-500 mb-2">今日告警</div>
                <div className="text-3xl font-bold text-gray-900">{alerts.length}</div>
              </div>
              <div className="w-12 h-12 rounded-lg bg-orange-100 flex items-center justify-center">
                <Bell className="text-orange-600" size={24} />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm font-medium text-gray-500 mb-2">交易记录</div>
                <div className="text-3xl font-bold text-gray-900">{trades.length}</div>
              </div>
              <div className="w-12 h-12 rounded-lg bg-green-100 flex items-center justify-center">
                <Coins className="text-green-600" size={24} />
              </div>
            </div>
          </div>

          {avgBuyPrice > 0 && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm font-medium text-gray-500 mb-2">平均买入价</div>
                  <div className="text-2xl font-bold text-gray-900 font-mono">¥{avgBuyPrice.toFixed(2)}</div>
                  <div className={`text-sm font-semibold mt-1 ${latestPrice >= avgBuyPrice ? 'text-red-600' : 'text-green-600'}`}>
                    {latestPrice >= avgBuyPrice ? '盈利' : '亏损'} ¥{Math.abs(latestPrice - avgBuyPrice).toFixed(2)}
                  </div>
                </div>
                <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${
                  latestPrice >= avgBuyPrice ? 'bg-red-100' : 'bg-green-100'
                }`}>
                  <TrendingUp className={latestPrice >= avgBuyPrice ? 'text-red-600' : 'text-green-600'} size={24} />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Chart */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="mb-4 flex justify-between items-center">
            <div>
              <h2 className="text-lg font-bold text-gray-900">价格走势图</h2>
              <p className="text-sm text-gray-500 mt-0.5">分钟线数据 · 点击图表记录交易</p>
            </div>
            <div className="flex items-center gap-3">
              <DateRangeSelector
                value={chartHours}
                onChange={setChartHours}
                options={[
                  { label: "6小时", value: 6 },
                  { label: "12小时", value: 12 },
                  { label: "24小时", value: 24 },
                  { label: "3天", value: 72 },
                  { label: "7天", value: 168 },
                  { label: "15天", value: 360 },
                  { label: "30天", value: 720 },
                ]}
              />
              <div className="flex items-center gap-2 text-xs font-medium text-green-700 bg-green-50 px-3 py-1.5 rounded-lg border border-green-200">
                <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
                实时更新
              </div>
            </div>
          </div>
          <GoldChart 
            data={prices} 
            trades={trades} 
            configs={configs} 
            onChartClick={handleChartClick} 
          />
        </div>

        {/* Daily Prices Table */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="mb-4 flex justify-end">
            <DateRangeSelector value={dailyDays} onChange={setDailyDays} />
          </div>
          <DailyPriceList dailyPrices={dailyPrices} />
        </div>

        {/* Alerts Table */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="mb-4 flex justify-end">
            <DateRangeSelector value={alertDays} onChange={setAlertDays} />
          </div>
          <AlertList alerts={alerts} />
        </div>

        {/* Trades Table */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="mb-4 flex justify-end">
            <DateRangeSelector value={tradeDays} onChange={setTradeDays} />
          </div>
          <TradeList trades={trades} currentPrice={latestPrice} />
        </div>

        {/* Reports Table */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="mb-4 flex justify-end">
            <DateRangeSelector value={reportDays} onChange={setReportDays} />
          </div>
          <ReportList reports={reports} />
        </div>

        {/* Active Targets */}
        {configs.filter(c => c.target_alert === 1 && c.target_price).length > 0 && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-4">活跃目标价</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {configs.filter(c => c.target_alert === 1 && c.target_price).map(c => {
                const targetPrice = c.target_price!;
                const isAbove = c.target_cmp === 'GTE';
                const isBelow = c.target_cmp === 'LTE';
                const isEqual = c.target_cmp === 'EQ';
                
                return (
                  <div key={c.id} className="flex justify-between items-center p-4 rounded-lg bg-gray-50 border border-gray-200 hover:border-gray-300 transition-colors">
                    <div>
                      <div className={`text-sm font-semibold mb-1 ${
                        isAbove ? 'text-blue-600' : isBelow ? 'text-orange-600' : 'text-purple-600'
                      }`}>
                        {isAbove ? '↑ 突破目标' : isBelow ? '↓ 跌破目标' : '= 到达目标'}
                      </div>
                      <div className="text-xs text-gray-500">{c.symbol}</div>
                    </div>
                    <div className="font-mono font-bold text-gray-900 text-xl">¥{targetPrice.toFixed(2)}</div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </main>

      {/* Modals */}
      <TradeModal 
        isOpen={isTradeModalOpen} 
        onClose={() => setIsTradeModalOpen(false)} 
        onSubmit={handleTradeSubmit}
        initialData={selectedTrade}
      />

      <TargetModal
        isOpen={isTargetModalOpen}
        onClose={() => setIsTargetModalOpen(false)}
        onSubmit={handleTargetSubmit}
      />

      <TestModal
        isOpen={isTestModalOpen}
        onClose={() => setIsTestModalOpen(false)}
        onSuccess={fetchData}
      />
    </div>
  );
}

export default App;
