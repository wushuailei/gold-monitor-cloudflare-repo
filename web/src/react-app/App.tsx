import { useState } from "react";
import { api, GlobalConfig, UserTarget } from "../lib/api";
import { Trade } from "../types";
import { useGoldData } from "../hooks/useGoldData";
import { Header } from "../components/Header";
import { PriceCards } from "../components/PriceCards";
import { StatsCards } from "../components/StatsCards";
import { GoldChart } from "../components/GoldChart";
import { TradeModal } from "../components/TradeModal";
import { TargetModal } from "../components/TargetModal";
import { GlobalConfigModal } from "../components/GlobalConfigModal";
import { TestModal } from "../components/TestModal";
import { ReportList } from "../components/ReportList";
import { AlertList } from "../components/AlertList";
import { TradeList } from "../components/TradeList";
import { DailyPriceList } from "../components/DailyPriceList";
import { DateRangeSelector } from "../components/DateRangeSelector";
import { TargetManagement } from "../components/TargetManagement";
import { GlobalConfigDisplay } from "../components/GlobalConfigDisplay";

function App() {
  // 时间范围选择
  const [chartHours, setChartHours] = useState(24);
  const [dailyDays, setDailyDays] = useState(7);
  const [tradeDays, setTradeDays] = useState(7);
  const [alertDays, setAlertDays] = useState(7);
  const [reportDays, setReportDays] = useState(7);

  // 获取数据
  const {
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
    refetch,
  } = useGoldData(chartHours, dailyDays, tradeDays, alertDays, reportDays);

  // 弹窗状态
  const [isTradeModalOpen, setIsTradeModalOpen] = useState(false);
  const [isTargetModalOpen, setIsTargetModalOpen] = useState(false);
  const [isGlobalConfigModalOpen, setIsGlobalConfigModalOpen] = useState(false);
  const [isTestModalOpen, setIsTestModalOpen] = useState(false);
  const [selectedTrade, setSelectedTrade] = useState<Partial<Trade>>({});
  const [selectedTarget, setSelectedTarget] = useState<UserTarget | undefined>(undefined);

  // 计算价格数据
  const latestPrice = prices.length > 0 ? prices[prices.length - 1].price : 0;
  const latestXauPrice = prices.length > 0 ? prices[prices.length - 1].xau_price : 0;
  const prevPrice = prices.length > 1 ? prices[prices.length - 2].price : latestPrice;
  const priceChange = latestPrice - prevPrice;
  const priceChangePercent = prevPrice > 0 ? (priceChange / prevPrice) * 100 : 0;
  const highPrice = prices.length > 0 ? Math.max(...prices.map((p) => p.price)) : 0;
  const lowPrice = prices.length > 0 ? Math.min(...prices.map((p) => p.price)) : 0;
  const priceRange = highPrice - lowPrice;

  // 事件处理
  const handleTradeSubmit = async (trade: Omit<Trade, "id">) => {
    await api.createTrade(trade);
    await refetch();
  };

  const handleTargetSubmit = async (target: {
    symbol: string;
    target_price: number;
    target_cmp: string;
  }) => {
    if (selectedTarget) {
      await api.updateUserTarget(selectedTarget.id, {
        target_price: target.target_price,
        target_cmp: target.target_cmp,
        target_alert: 1,
      });
    } else {
      await api.createUserTarget(target);
    }
    setSelectedTarget(undefined);
    await refetch();
  };

  const handleDeleteTarget = async (id: number) => {
    if (confirm("确定要删除这个目标价吗？")) {
      await api.deleteUserTarget(id);
      await refetch();
    }
  };

  const handleEditTarget = (target: UserTarget) => {
    setSelectedTarget(target);
    setIsTargetModalOpen(true);
  };

  const handleGlobalConfigSubmit = async (config: Omit<GlobalConfig, "id" | "updated_ts">) => {
    await api.updateGlobalConfig(config);
    await refetch();
  };

  return (
    <div className="min-h-screen bg-[#F5F7FA]">
      <Header
        loading={loading}
        onRefresh={refetch}
        onOpenGlobalConfig={() => setIsGlobalConfigModalOpen(true)}
        onOpenTest={() => setIsTestModalOpen(true)}
        onOpenAddTarget={() => {
          setSelectedTarget(undefined);
          setIsTargetModalOpen(true);
        }}
        onOpenAddTrade={() => {
          setSelectedTrade({});
          setIsTradeModalOpen(true);
        }}
      />

      <main className="max-w-[1800px] mx-auto px-8 py-6 space-y-6">
        {/* Price Cards */}
        <PriceCards
          latestPrice={latestPrice}
          latestXauPrice={latestXauPrice}
          priceChange={priceChange}
          priceChangePercent={priceChangePercent}
          highPrice={highPrice}
          lowPrice={lowPrice}
          priceRange={priceRange}
        />

        {/* Stats Cards */}
        <StatsCards
          userTargets={userTargets}
          alerts={alerts}
          trades={trades}
          latestPrice={latestPrice}
          holdings={holdings}
        />

        {/* Chart */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="mb-4 flex justify-between items-center">
            <div>
              <h2 className="text-lg font-bold text-gray-900">价格走势图</h2>
              <p className="text-sm text-gray-500 mt-0.5">分钟线数据</p>
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
          <TradeList 
            trades={trades} 
            currentPrice={latestPrice}
            holdingsAvgPrice={holdings?.avg_price || 0}
            holdingsQty={holdings?.total_qty || 0}
            holdingsCost={holdings?.total_cost || 0}
            holdingsRealizedProfit={holdings?.realized_profit || 0}
          />
        </div>

        {/* Reports Table */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="mb-4 flex justify-end">
            <DateRangeSelector value={reportDays} onChange={setReportDays} />
          </div>
          <ReportList reports={reports} />
        </div>

        {/* Target Management */}
        <TargetManagement
          userTargets={userTargets}
          onEdit={handleEditTarget}
          onDelete={handleDeleteTarget}
        />

        {/* Global Config Display */}
        <GlobalConfigDisplay
          globalConfig={globalConfig}
          onEdit={() => setIsGlobalConfigModalOpen(true)}
        />
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
        onClose={() => {
          setIsTargetModalOpen(false);
          setSelectedTarget(undefined);
        }}
        onSubmit={handleTargetSubmit}
        existingTarget={selectedTarget}
      />

      <GlobalConfigModal
        isOpen={isGlobalConfigModalOpen}
        onClose={() => setIsGlobalConfigModalOpen(false)}
        onSubmit={handleGlobalConfigSubmit}
        currentConfig={globalConfig || undefined}
      />

      <TestModal
        isOpen={isTestModalOpen}
        onClose={() => setIsTestModalOpen(false)}
        onSuccess={refetch}
      />
    </div>
  );
}

export default App;
