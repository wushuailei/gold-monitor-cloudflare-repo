import React, { useCallback, useEffect, useRef, useState } from "react";

// datetime-local 输入框用的本地时间格式 "YYYY-MM-DDTHH:mm"
function toLocalInputValue(ts: number): string {
  const d = new Date(ts * 1000);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}
import { api } from "../lib/api";
import { PricePoint, Holding, HoldingLot } from "../types";
import { formatBeijingDate } from "../utils/time";
import {
  RefreshCw,
  Plus,
  TrendingUp,
  ArrowDownLeft,
  ArrowUpRight,
  Coins,
  LayoutGrid,
  X,
} from "lucide-react";

interface MobileAppProps {
  onOpenDesktop?: () => void;
}

const pnlColor = (v: number) => (v >= 0 ? "text-red-600" : "text-green-600");
const pnlBg = (v: number) => (v >= 0 ? "bg-red-50" : "bg-green-50");
const pnlBorder = (v: number) => (v >= 0 ? "border-red-200" : "border-green-200");

function Sheet({
  open,
  onClose,
  title,
  children,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative bg-white w-full rounded-t-2xl p-5 pb-[calc(1.25rem+env(safe-area-inset-bottom))] max-h-[85vh] overflow-y-auto shadow-2xl">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-gray-900">{title}</h2>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 rounded-lg"
          >
            <X size={20} />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

function StatCard({
  label,
  value,
  sub,
  valueClass = "text-gray-900",
  gradient,
}: {
  label: string;
  value: string;
  sub?: string;
  valueClass?: string;
  gradient: string;
}) {
  return (
    <div className={`rounded-xl border p-3 ${gradient}`}>
      <div className="text-xs font-medium text-gray-500 mb-1">{label}</div>
      <div className={`text-lg font-bold font-mono ${valueClass} truncate`}>{value}</div>
      {sub && <div className="text-[11px] text-gray-500 mt-0.5 truncate">{sub}</div>}
    </div>
  );
}

export function MobileApp({ onOpenDesktop }: MobileAppProps) {
  const [prices, setPrices] = useState<PricePoint[]>([]);
  const [holdings, setHoldings] = useState<Holding | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // 底部弹层状态
  const [buyOpen, setBuyOpen] = useState(false);
  const [sellOpen, setSellOpen] = useState(false);
  const [sellLot, setSellLot] = useState<HoldingLot | null>(null);

  const fetchData = useCallback(async () => {
    try {
      const [priceData, holdingData] = await Promise.all([
        api.getPrices(24),
        api.getHoldings(),
      ]);
      setPrices(priceData);
      setHoldings(holdingData);
    } catch (err) {
      console.error("Failed to fetch mobile data:", err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
    const timer = setInterval(fetchData, 60 * 1000);
    return () => clearInterval(timer);
  }, [fetchData]);

  const latestPrice = prices.length > 0 ? prices[prices.length - 1].price : 0;
  const latestXau = prices.length > 0 ? prices[prices.length - 1].xau_price : 0;
  const prevPrice = prices.length > 1 ? prices[prices.length - 2].price : latestPrice;
  const priceChange = latestPrice - prevPrice;
  const priceChangePercent = prevPrice > 0 ? (priceChange / prevPrice) * 100 : 0;

  const totalQty = holdings?.total_qty || 0;
  const totalCost = holdings?.total_cost || 0;
  const realizedProfit = holdings?.realized_profit || 0;
  const marketValue = totalQty > 0 && latestPrice > 0 ? totalQty * latestPrice : 0;
  const totalPnl = marketValue - totalCost;
  const totalPnlPercent = totalCost > 0 ? (totalPnl / totalCost) * 100 : 0;

  const handleRefresh = () => {
    setRefreshing(true);
    fetchData();
  };

  const handleBuySubmit = async (ts: number, price: number, qty: number, note: string) => {
    await api.createTrade({
      ts,
      symbol: "AU",
      side: "买",
      price,
      qty,
      note: note || undefined,
    });
    setBuyOpen(false);
    await fetchData();
  };

  const handleSellSubmit = async (ts: number, price: number, qty: number, note: string, lotId: number) => {
    await api.createTrade({
      ts,
      symbol: "AU",
      side: "卖",
      price,
      qty,
      note: note || undefined,
      lot_id: lotId,
    });
    setSellOpen(false);
    setSellLot(null);
    await fetchData();
  };

  return (
    <div className="min-h-screen bg-[#F5F7FA] pb-28">
      {/* 顶部栏 */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-40">
        <div className="px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center">
              <TrendingUp className="text-white" size={16} strokeWidth={2.5} />
            </div>
            <div>
              <h1 className="text-base font-bold text-gray-900 leading-tight">黄金价格监控</h1>
              <div className="text-[10px] text-gray-400 leading-tight">AU9999 · 北京时间</div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {onOpenDesktop && (
              <button
                onClick={onOpenDesktop}
                className="p-2 text-gray-500 hover:text-gray-900 rounded-lg flex items-center gap-1 text-xs"
                title="切换到完整版"
              >
                <LayoutGrid size={16} />
                完整版
              </button>
            )}
            <button
              onClick={handleRefresh}
              className="p-2 text-gray-500 hover:text-gray-900 rounded-lg"
              title="刷新"
            >
              <RefreshCw size={18} className={refreshing ? "animate-spin" : ""} />
            </button>
          </div>
        </div>
      </header>

      <main className="px-4 py-4 space-y-4">
        {/* 金价卡 */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
          <div className="flex items-center justify-between mb-2">
            <div className="text-sm font-medium text-gray-500">国内金价 (AU9999)</div>
            <div className={`px-2 py-0.5 rounded-lg text-xs font-bold ${
              priceChange >= 0 ? "bg-red-100 text-red-700" : "bg-green-100 text-green-700"
            }`}>
              {priceChange >= 0 ? "↑" : "↓"} {Math.abs(priceChangePercent).toFixed(2)}%
            </div>
          </div>
          <div className="flex items-end justify-between">
            <div className={`text-4xl font-bold font-mono ${pnlColor(priceChange)}`}>
              ¥{latestPrice.toFixed(2)}
            </div>
            <div className="text-right">
              <div className={`text-sm font-semibold ${pnlColor(priceChange)}`}>
                {priceChange >= 0 ? "+" : ""}{priceChange.toFixed(2)} 元/克
              </div>
              {latestXau > 0 && (
                <div className="text-xs text-gray-500 mt-0.5">国际金价 ${latestXau.toFixed(2)}/盎司</div>
              )}
            </div>
          </div>
        </div>

        {/* 持仓盈亏总览 */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="text-sm font-bold text-gray-900">持仓盈亏</div>
            <div className="text-xs text-gray-400">{holdings?.lots?.length || 0} 笔持仓</div>
          </div>

          {/* 总浮盈大数字 */}
          <div className={`rounded-xl border p-4 mb-3 ${pnlBg(totalPnl)} ${pnlBorder(totalPnl)}`}>
            <div className="text-xs font-medium text-gray-500 mb-1">总浮盈/浮亏（未卖出）</div>
            <div className={`text-3xl font-bold font-mono ${pnlColor(totalPnl)}`}>
              {totalPnl >= 0 ? "+" : ""}¥{totalPnl.toFixed(2)}
            </div>
            <div className={`text-xs mt-1 font-medium ${pnlColor(totalPnl)}`}>
              收益率 {totalPnlPercent >= 0 ? "+" : ""}{totalPnlPercent.toFixed(2)}%
            </div>
          </div>

          {/* 总克重 + 均价 大卡 */}
          <div className="grid grid-cols-2 gap-2 mb-2">
            <div className="rounded-xl border border-blue-200 bg-blue-50 p-4">
              <div className="text-xs font-medium text-blue-600 mb-1">总持仓克重</div>
              <div className="text-2xl font-bold font-mono text-blue-900">{totalQty.toFixed(4)} 克</div>
            </div>
            <div className="rounded-xl border border-cyan-200 bg-cyan-50 p-4">
              <div className="text-xs font-medium text-cyan-600 mb-1">持仓均价</div>
              <div className="text-2xl font-bold font-mono text-cyan-900">
                ¥{(holdings?.avg_price || 0).toFixed(2)}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <StatCard
              label="总成本"
              value={`¥${totalCost.toFixed(2)}`}
              gradient="bg-gray-50 border-gray-200"
            />
            <StatCard
              label="当前市值"
              value={`¥${marketValue.toFixed(2)}`}
              sub={latestPrice > 0 ? `现价 ¥${latestPrice.toFixed(2)}/克` : undefined}
              gradient="bg-amber-50 border-amber-200"
            />
            <StatCard
              label="已实现盈亏（卖出）"
              value={`${realizedProfit >= 0 ? "+" : ""}¥${realizedProfit.toFixed(2)}`}
              valueClass={pnlColor(realizedProfit)}
              gradient="bg-blue-50 border-blue-200"
            />
            <StatCard
              label="持仓批次"
              value={`${holdings?.lots?.length || 0} 笔`}
              gradient="bg-purple-50 border-purple-200"
            />
          </div>
        </div>

        {/* 逐笔持仓 */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
          <div className="flex items-center gap-2 mb-3">
            <Coins size={16} className="text-amber-600" />
            <div className="text-sm font-bold text-gray-900">逐笔持仓</div>
          </div>

          {!holdings || holdings.lots.length === 0 ? (
            <div className="text-center py-10">
              <div className="w-14 h-14 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-3">
                <Coins size={24} className="text-gray-400" />
              </div>
              <div className="text-gray-500 text-sm">暂无持仓</div>
              <div className="text-gray-400 text-xs mt-1">点击下方「买入」开始记录</div>
            </div>
          ) : (
            <div className="space-y-3">
              {holdings.lots.map((lot) => {
                const lotValue = lot.qty * latestPrice;
                const lotCost = lot.qty * lot.cost_price;
                const lotPnl = lotValue - lotCost;
                const lotPnlPercent = lotCost > 0 ? (lotPnl / lotCost) * 100 : 0;
                return (
                  <div
                    key={lot.id}
                    className={`rounded-xl border p-3 ${pnlBg(lotPnl)} ${pnlBorder(lotPnl)}`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <ArrowDownLeft size={14} className="text-green-600" />
                        <span className="text-sm font-semibold text-gray-900">
                          买入 {formatBeijingDate(lot.bought_ts, "MM月dd日 HH:mm")}
                        </span>
                        {lot.note && (
                          <span className="text-[11px] text-gray-500 bg-white/70 px-1.5 py-0.5 rounded">
                            {lot.note}
                          </span>
                        )}
                      </div>
                      <button
                        onClick={() => {
                          setSellLot(lot);
                          setSellOpen(true);
                        }}
                        className="px-3 py-1.5 bg-red-500 text-white text-xs font-semibold rounded-lg active:bg-red-600"
                      >
                        卖出
                      </button>
                    </div>
                    <div className="grid grid-cols-3 gap-2 text-center">
                      <div>
                        <div className="text-[11px] text-gray-500">成本价</div>
                        <div className="text-sm font-bold font-mono text-gray-900">¥{lot.cost_price.toFixed(2)}</div>
                      </div>
                      <div>
                        <div className="text-[11px] text-gray-500">现价</div>
                        <div className="text-sm font-bold font-mono text-gray-900">
                          {latestPrice > 0 ? `¥${latestPrice.toFixed(2)}` : "-"}
                        </div>
                      </div>
                      <div>
                        <div className="text-[11px] text-gray-500">剩余</div>
                        <div className="text-sm font-bold font-mono text-gray-900">{lot.qty.toFixed(4)} 克</div>
                      </div>
                    </div>
                    <div className="mt-2 pt-2 border-t border-black/5 flex items-center justify-between">
                      <div className="text-[11px] text-gray-500">市值 ¥{lotValue.toFixed(2)}</div>
                      <div className={`text-sm font-bold font-mono ${pnlColor(lotPnl)}`}>
                        浮盈 {lotPnl >= 0 ? "+" : ""}¥{lotPnl.toFixed(2)} ({lotPnlPercent >= 0 ? "+" : ""}{lotPnlPercent.toFixed(2)}%)
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {loading && (
          <div className="text-center text-xs text-gray-400 py-2">加载中...</div>
        )}
      </main>

      {/* 底部买入按钮 */}
      <div className="fixed bottom-0 inset-x-0 z-40 p-4 pb-[calc(1rem+env(safe-area-inset-bottom))] bg-gradient-to-t from-[#F5F7FA] via-[#F5F7FA]/95 to-transparent pointer-events-none">
        <div className="max-w-lg mx-auto flex gap-3 pointer-events-auto">
          <button
            onClick={() => setBuyOpen(true)}
            className="flex-1 h-14 bg-green-500 text-white rounded-2xl font-bold text-base flex items-center justify-center gap-2 shadow-lg active:bg-green-600 transition-colors"
          >
            <Plus size={22} />
            买入
          </button>
          <button
            onClick={() => {
              if (holdings?.lots?.length) {
                setSellLot(holdings.lots[0]);
                setSellOpen(true);
              } else {
                alert("暂无持仓，请先买入");
              }
            }}
            className="flex-1 h-14 bg-red-500 text-white rounded-2xl font-bold text-base flex items-center justify-center gap-2 shadow-lg active:bg-red-600 transition-colors"
          >
            <ArrowUpRight size={22} />
            卖出
          </button>
        </div>
      </div>

      {/* 买入弹层 */}
      <BuySheet open={buyOpen} onClose={() => setBuyOpen(false)} defaultPrice={latestPrice} onSubmit={handleBuySubmit} />

      {/* 卖出弹层 */}
      <SellSheet
        open={sellOpen}
        onClose={() => {
          setSellOpen(false);
          setSellLot(null);
        }}
        defaultPrice={latestPrice}
        lot={sellLot}
        onSubmit={handleSellSubmit}
      />
    </div>
  );
}

function BuySheet({
  open,
  onClose,
  defaultPrice,
  onSubmit,
}: {
  open: boolean;
  onClose: () => void;
  defaultPrice: number;
  onSubmit: (ts: number, price: number, qty: number, note: string) => Promise<void>;
}) {
  const [price, setPrice] = useState("");
  const [qty, setQty] = useState("");
  const [note, setNote] = useState("");
  const [ts, setTs] = useState("");
  const [loading, setLoading] = useState(false);

  // 只在弹层「打开瞬间」初始化一次，避免 defaultPrice 刷新时覆盖用户已填写的内容
  const prevOpenRef = useRef(false);
  useEffect(() => {
    const justOpened = open && !prevOpenRef.current;
    prevOpenRef.current = open;

    if (!justOpened) return;

    setPrice(defaultPrice > 0 ? String(defaultPrice) : "");
    setQty("");
    setNote("");
    // 默认当前时间（可选，用户可修改或清空）
    setTs(toLocalInputValue(Math.floor(Date.now() / 1000)));
  }, [open, defaultPrice]);

  const amount = price && qty && parseFloat(price) > 0 && parseFloat(qty) > 0
    ? parseFloat(price) * parseFloat(qty)
    : null;

  const handleSubmit = async () => {
    if (!price || parseFloat(price) <= 0 || !qty || parseFloat(qty) <= 0) {
      alert("请输入有效的克价和克数");
      return;
    }
    // 时间可选：为空则默认当前时间
    const tradeTs = ts ? Math.floor(new Date(ts).getTime() / 1000) : Math.floor(Date.now() / 1000);
    setLoading(true);
    try {
      await onSubmit(tradeTs, parseFloat(price), parseFloat(qty), note);
    } catch (err: any) {
      alert(err?.message?.replace(/^Error: /, "") || "提交失败");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Sheet open={open} onClose={onClose} title="买入黄金">
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1.5">时间（可选，默认当前时间）</label>
          <input
            type="datetime-local"
            value={ts}
            onChange={(e) => setTs(e.target.value)}
            className="w-full bg-white border border-gray-300 rounded-xl px-4 py-3 text-gray-900 focus:outline-none focus:ring-2 focus:ring-green-500"
          />
        </div>
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1.5">克价 (元/克)</label>
          <input
            type="number"
            inputMode="decimal"
            step="0.01"
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            className="w-full bg-white border border-gray-300 rounded-xl px-4 py-3 text-lg text-gray-900 font-mono focus:outline-none focus:ring-2 focus:ring-green-500"
            placeholder="例如 580.50"
          />
        </div>
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1.5">克数 (克，精确到 0.0001)</label>
          <input
            type="number"
            inputMode="decimal"
            step="0.0001"
            value={qty}
            onChange={(e) => setQty(e.target.value)}
            className="w-full bg-white border border-gray-300 rounded-xl px-4 py-3 text-lg text-gray-900 font-mono focus:outline-none focus:ring-2 focus:ring-green-500"
            placeholder="例如 10.0000"
          />
        </div>
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1.5">备注（可选）</label>
          <input
            type="text"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            className="w-full bg-white border border-gray-300 rounded-xl px-4 py-3 text-gray-900 focus:outline-none focus:ring-2 focus:ring-green-500"
            placeholder="例如 第一批"
          />
        </div>
        <div className="flex items-center justify-between bg-gray-50 rounded-xl px-4 py-3">
          <span className="text-sm text-gray-500">成交金额</span>
          <span className="text-lg font-bold font-mono text-gray-900">
            {amount !== null ? `¥${amount.toFixed(2)}` : "-"}
          </span>
        </div>
        <button
          onClick={handleSubmit}
          disabled={loading}
          className="w-full h-13 py-3.5 bg-green-500 text-white rounded-xl font-bold text-base shadow-md active:bg-green-600 disabled:opacity-50"
        >
          {loading ? "提交中..." : "确认买入"}
        </button>
      </div>
    </Sheet>
  );
}

function SellSheet({
  open,
  onClose,
  defaultPrice,
  lot,
  onSubmit,
}: {
  open: boolean;
  onClose: () => void;
  defaultPrice: number;
  lot: HoldingLot | null;
  onSubmit: (ts: number, price: number, qty: number, note: string, lotId: number) => Promise<void>;
}) {
  const [price, setPrice] = useState("");
  const [qty, setQty] = useState("");
  const [note, setNote] = useState("");
  const [ts, setTs] = useState("");
  const [loading, setLoading] = useState(false);

  // 只在弹层「打开瞬间」初始化一次，避免 defaultPrice 刷新时覆盖用户已填写的内容
  const prevOpenRef = useRef(false);
  useEffect(() => {
    const justOpened = open && !prevOpenRef.current;
    prevOpenRef.current = open;

    if (!justOpened) return;

    setPrice(defaultPrice > 0 ? String(defaultPrice) : "");
    setQty("");
    setNote("");
    // 默认当前时间（可选，用户可修改或清空）
    setTs(toLocalInputValue(Math.floor(Date.now() / 1000)));
  }, [open, defaultPrice]);

  const maxQty = lot?.qty || 0;
  const qtyNum = parseFloat(qty) || 0;
  const estimatedPnl = lot && qtyNum > 0 && parseFloat(price) > 0
    ? (parseFloat(price) - lot.cost_price) * qtyNum
    : null;

  const handleSubmit = async () => {
    if (!lot) return;
    if (!price || parseFloat(price) <= 0) {
      alert("请输入有效的卖出价");
      return;
    }
    if (!qty || qtyNum <= 0) {
      alert("请输入卖出克数");
      return;
    }
    if (qtyNum > maxQty) {
      alert(`该批次仅剩 ${maxQty.toFixed(4)} 克`);
      return;
    }
    // 时间可选：为空则默认当前时间
    const tradeTs = ts ? Math.floor(new Date(ts).getTime() / 1000) : Math.floor(Date.now() / 1000);
    setLoading(true);
    try {
      await onSubmit(tradeTs, parseFloat(price), qtyNum, note, lot.id);
    } catch (err: any) {
      alert(err?.message?.replace(/^Error: /, "") || "提交失败");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Sheet open={open} onClose={onClose} title="卖出黄金">
      {lot && (
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">时间（可选，默认当前时间）</label>
            <input
              type="datetime-local"
              value={ts}
              onChange={(e) => setTs(e.target.value)}
              className="w-full bg-white border border-gray-300 rounded-xl px-4 py-3 text-gray-900 focus:outline-none focus:ring-2 focus:ring-red-500"
            />
          </div>
          <div className="rounded-xl bg-gray-50 border border-gray-200 p-3 flex items-center justify-between">
            <div>
              <div className="text-xs text-gray-500">卖出批次</div>
              <div className="text-sm font-semibold text-gray-900">
                买入 {formatBeijingDate(lot.bought_ts, "MM月dd日")} · 成本 ¥{lot.cost_price.toFixed(2)}
              </div>
              {lot.note && <div className="text-xs text-gray-400">{lot.note}</div>}
            </div>
            <div className="text-right">
              <div className="text-xs text-gray-500">剩余克数</div>
              <div className="text-lg font-bold font-mono text-gray-900">{maxQty.toFixed(4)} 克</div>
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">卖出价 (元/克)</label>
            <input
              type="number"
              inputMode="decimal"
              step="0.01"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              className="w-full bg-white border border-gray-300 rounded-xl px-4 py-3 text-lg text-gray-900 font-mono focus:outline-none focus:ring-2 focus:ring-red-500"
              placeholder="例如 610.00"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">卖出克数 (最多 {maxQty.toFixed(4)} 克)</label>
            <input
              type="number"
              inputMode="decimal"
              step="0.0001"
              max={maxQty}
              value={qty}
              onChange={(e) => setQty(e.target.value)}
              className="w-full bg-white border border-gray-300 rounded-xl px-4 py-3 text-lg text-gray-900 font-mono focus:outline-none focus:ring-2 focus:ring-red-500"
              placeholder={`最多 ${maxQty.toFixed(4)} 克`}
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">备注（可选）</label>
            <input
              type="text"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              className="w-full bg-white border border-gray-300 rounded-xl px-4 py-3 text-gray-900 focus:outline-none focus:ring-2 focus:ring-red-500"
              placeholder="例如 止盈"
            />
          </div>

          <div className={`rounded-xl border p-3 ${estimatedPnl !== null ? (estimatedPnl >= 0 ? pnlBg(1) : pnlBg(-1)) : "bg-gray-50"} ${estimatedPnl !== null ? (estimatedPnl >= 0 ? pnlBorder(1) : pnlBorder(-1)) : "border-gray-200"}`}>
            <div className="text-xs text-gray-500 mb-0.5">预计实盈 = (卖出价 − 成本 ¥{lot.cost_price.toFixed(2)}) × 克数</div>
            <div className={`text-2xl font-bold font-mono ${estimatedPnl !== null ? pnlColor(estimatedPnl) : "text-gray-900"}`}>
              {estimatedPnl !== null ? `${estimatedPnl >= 0 ? "+" : ""}¥${estimatedPnl.toFixed(2)}` : "-"}
            </div>
          </div>

          <button
            onClick={handleSubmit}
            disabled={loading}
            className="w-full py-3.5 bg-red-500 text-white rounded-xl font-bold text-base shadow-md active:bg-red-600 disabled:opacity-50"
          >
            {loading ? "提交中..." : "确认卖出"}
          </button>
        </div>
      )}
    </Sheet>
  );
}
