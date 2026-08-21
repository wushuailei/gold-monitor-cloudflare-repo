import { useState, useEffect } from "react";
import { api, GlobalConfig, UserTarget } from "../lib/api";
import { Trade, HoldingLot } from "../types";
import { useGoldData } from "../hooks/useGoldData";
import { MobileApp } from "./MobileApp";
import { HoldingsSection } from "../components/HoldingsSection";
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
import { PriceLevelList } from "../components/PriceLevelList";
import { DateRangeSelector } from "../components/DateRangeSelector";
import { TargetManagement } from "../components/TargetManagement";
import { GlobalConfigDisplay } from "../components/GlobalConfigDisplay";

function DesktopApp() {
  // 时间范围选择
  const [chartHours, setChartHours] = useState(24);
  const [dailyDays, setDailyDays] = useState(7);
  const [tradeDays, setTradeDays] = useState(7);
  const [alertDays, setAlertDays] = useState(7);
  const [reportDays, setReportDays] = useState(7);
  const [priceLevelDays, setPriceLevelDays] = useState(7);

  // 获取数据
  const {
    prices,
    dailyPrices,
    trades,
    reports,
    alerts,
    priceLevels,
    configs,
    globalConfig,
    userTargets,
    holdings,
    loading,
    refetch,
  } = useGoldData(chartHours, dailyDays, tradeDays, alertDays, reportDays, priceLevelDays);

  // 弹窗状态
  const [isTradeModalOpen, setIsTradeModalOpen] = useState(false);
  const [isTargetModalOpen, setIsTargetModalOpen] = useState(false);
  const [isGlobalConfigModalOpen, setIsGlobalConfigModalOpen] = useState(false);
  const [isTestModalOpen, setIsTestModalOpen] = useState(false);
  const [selectedTrade, setSelectedTrade] = useState<Partial<Trade>>({});
  const [selectedTarget, setSelectedTarget] = useState<UserTarget | undefined>(undefined);
  const [selectedLotId, setSelectedLotId] = useState<number | undefined>(undefined);

  // 计算价格数据
  const latestPrice = prices.length > 0 ? prices[prices.length - 1].price : 0;
  const latestXauPrice = prices.length > 0 ? prices[prices.length - 1].xau_price : 0;
  const prevPrice = prices.length > 1 ? prices[prices.length - 2].price : latestPrice;
  const priceChange = latestPrice - prevPrice;
  const priceChangePercent = prevPrice > 0 ? (priceChange / prevPrice) * 100 : 0;

  // 获取昨日日线数据（按 day_ts 倒序排列后的第二条，因为第一条是今天）
  const sortedDailyPrices = [...dailyPrices].sort((a, b) => b.day_ts - a.day_ts);
  const yesterdayDaily = sortedDailyPrices.length > 1 ? sortedDailyPrices[1] : sortedDailyPrices[0];

  // 事件处理
  const handleTradeSubmit = async (trade: Omit<Trade, "id">) => {
    await api.createTrade(trade);
    await refetch();
  };

  const handleDeleteTrade = async (id: number) => {
    if (confirm("确定要删除这条交易记录吗？删除后持仓数据将重新计算。")) {
      await api.deleteTrade(id);
      await refetch();
    }
  };

  const handleSellLot = (lot: HoldingLot) => {
    setSelectedLotId(lot.id);
    setSelectedTrade({ side: "卖" });
    setIsTradeModalOpen(true);
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
        onOpenAddTrade={(side) => {
          setSelectedLotId(undefined);
          setSelectedTrade({ side });
          setIsTradeModalOpen(true);
        }}
      />

      <main className="max-w-[1800px] mx-auto px-4 md:px-8 py-4 md:py-6 space-y-4 md:space-y-6">
        {/* Price Cards */}
        <PriceCards
          latestPrice={latestPrice}
          latestXauPrice={latestXauPrice}
          priceChange={priceChange}
          priceChangePercent={priceChangePercent}
          yesterdayDaily={yesterdayDaily}
        />

        {/* Stats Cards */}
        <StatsCards
          userTargets={userTargets}
          alerts={alerts}
          trades={trades}
          latestPrice={latestPrice}
          holdings={holdings}
        />

        {/* 逐笔持仓 */}
        <HoldingsSection
          lots={holdings?.lots || []}
          currentPrice={latestPrice}
          totalQty={holdings?.total_qty || 0}
          totalCost={holdings?.total_cost || 0}
          avgPrice={holdings?.avg_price || 0}
          realizedProfit={holdings?.realized_profit || 0}
          onSellLot={handleSellLot}
        />

        {/* Chart */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 md:p-6">
          <div className="mb-4 flex flex-col md:flex-row md:justify-between md:items-center gap-3">
            <div>
              <h2 className="text-lg font-bold text-gray-900">价格走势图</h2>
              <p className="text-sm text-gray-500 mt-0.5">分钟线数据</p>
            </div>
            <div className="flex items-center gap-3 flex-wrap">
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
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 md:p-6">
          <div className="mb-4 flex justify-end">
            <DateRangeSelector value={dailyDays} onChange={setDailyDays} />
          </div>
          <DailyPriceList dailyPrices={dailyPrices} />
        </div>

        {/* Alerts Table */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 md:p-6">
          <div className="mb-4 flex justify-end">
            <DateRangeSelector value={alertDays} onChange={setAlertDays} />
          </div>
          <AlertList alerts={alerts} />
        </div>

        {/* Price Levels Table */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 md:p-6">
          <div className="mb-4 flex justify-end">
            <DateRangeSelector value={priceLevelDays} onChange={setPriceLevelDays} />
          </div>
          <PriceLevelList priceLevels={priceLevels} />
        </div>

        {/* Trades Table */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 md:p-6">
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
            onDeleteTrade={handleDeleteTrade}
          />
        </div>

        {/* Reports Table */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 md:p-6">
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
        onClose={() => {
          setIsTradeModalOpen(false);
          setSelectedLotId(undefined);
        }}
        onSubmit={handleTradeSubmit}
        initialData={selectedTrade}
        lots={holdings?.lots || []}
        currentPrice={latestPrice}
        initialLotId={selectedLotId}
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

function App() {
  // 移动端检测（宽度 < 768px 视为手机）
  const [isMobile, setIsMobile] = useState(() => window.innerWidth < 768);
  // 允许用户从移动版手动切换到完整版
  const [forceDesktop, setForceDesktop] = useState(
    () => localStorage.getItem("gold-monitor-force-desktop") === "1",
  );

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  if (isMobile && !forceDesktop) {
    return (
      <MobileApp
        onOpenDesktop={() => {
          localStorage.setItem("gold-monitor-force-desktop", "1");
          setForceDesktop(true);
        }}
      />
    );
  }

  // 手机宽度但强制使用完整版：提供返回移动版的悬浮按钮
  if (isMobile && forceDesktop) {
    return (
      <>
        <DesktopApp />
        <button
          onClick={() => {
            localStorage.removeItem("gold-monitor-force-desktop");
            setForceDesktop(false);
          }}
          className="fixed bottom-5 right-5 z-50 px-4 py-2.5 bg-amber-500 text-white rounded-full shadow-lg text-sm font-semibold active:bg-amber-600"
        >
          返回移动版
        </button>
      </>
    );
  }

  return <DesktopApp />;
}

export default App;
