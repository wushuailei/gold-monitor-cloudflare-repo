import { HoldingLot } from "../types";
import { formatBeijingDate } from "../utils/time";
import { ArrowDownLeft, Coins } from "lucide-react";

interface HoldingsSectionProps {
  lots: HoldingLot[];
  currentPrice: number;
  totalQty: number;
  totalCost: number;
  avgPrice: number;
  realizedProfit: number;
  onSellLot: (lot: HoldingLot) => void;
}

const pnlColor = (v: number) => (v >= 0 ? "text-red-600" : "text-green-600");
const pnlBg = (v: number) => (v >= 0 ? "bg-red-50" : "bg-green-50");
const pnlBorder = (v: number) => (v >= 0 ? "border-red-200" : "border-green-200");

export function HoldingsSection({
  lots,
  currentPrice = 0,
  totalQty = 0,
  totalCost = 0,
  avgPrice = 0,
  realizedProfit = 0,
  onSellLot,
}: HoldingsSectionProps) {
  const marketValue = totalQty > 0 && currentPrice > 0 ? totalQty * currentPrice : 0;
  const totalPnl = marketValue - totalCost;
  const totalPnlPercent = totalCost > 0 ? (totalPnl / totalCost) * 100 : 0;

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 md:p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-100 to-indigo-100 flex items-center justify-center">
            <Coins size={20} className="text-blue-600" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-gray-900">逐笔持仓</h3>
            <p className="text-xs text-gray-400">每笔买入一个批次，可单独卖出</p>
          </div>
        </div>
        <div className="text-sm text-gray-500 font-medium hidden md:block">
          {lots.length} 个批次
        </div>
      </div>

      {/* 批次汇总条 */}
      <div className="grid grid-cols-2 md:grid-cols-6 gap-3 mb-4">
        <div className="rounded-lg border border-blue-200 bg-blue-50 p-3">
          <div className="text-xs text-blue-600 font-medium mb-1">总持仓克重</div>
          <div className="text-xl font-bold font-mono text-blue-900">{totalQty.toFixed(2)} 克</div>
        </div>
        <div className="rounded-lg border border-cyan-200 bg-cyan-50 p-3">
          <div className="text-xs text-cyan-600 font-medium mb-1">持仓均价</div>
          <div className="text-xl font-bold font-mono text-cyan-900">¥{avgPrice.toFixed(2)}</div>
        </div>
        <div className={`rounded-lg border p-3 ${pnlBg(totalPnl)} ${pnlBorder(totalPnl)}`}>
          <div className={`text-xs font-medium mb-1 ${pnlColor(totalPnl)}`}>总浮盈/浮亏</div>
          <div className={`text-xl font-bold font-mono ${pnlColor(totalPnl)}`}>
            {totalPnl >= 0 ? "+" : ""}¥{totalPnl.toFixed(2)}
          </div>
          <div className={`text-xs mt-0.5 ${pnlColor(totalPnl)}`}>
            {totalPnlPercent >= 0 ? "+" : ""}{totalPnlPercent.toFixed(2)}%
          </div>
        </div>
        <div className={`rounded-lg border p-3 ${pnlBg(realizedProfit)} ${pnlBorder(realizedProfit)}`}>
          <div className={`text-xs font-medium mb-1 ${pnlColor(realizedProfit)}`}>已实现盈亏</div>
          <div className={`text-xl font-bold font-mono ${pnlColor(realizedProfit)}`}>
            {realizedProfit >= 0 ? "+" : ""}¥{realizedProfit.toFixed(2)}
          </div>
        </div>
        <div className="rounded-lg border border-amber-200 bg-amber-50 p-3">
          <div className="text-xs text-amber-600 font-medium mb-1">总成本</div>
          <div className="text-xl font-bold font-mono text-amber-900">¥{totalCost.toFixed(2)}</div>
        </div>
        <div className="rounded-lg border border-gray-200 bg-gray-50 p-3">
          <div className="text-xs text-gray-500 font-medium mb-1">当前市值</div>
          <div className="text-xl font-bold font-mono text-gray-900">¥{marketValue.toFixed(2)}</div>
          <div className="text-xs text-gray-400 mt-0.5">现价 ¥{currentPrice.toFixed(2)}/克</div>
        </div>
      </div>

      {/* 批次明细 */}
      {lots.length === 0 ? (
        <div className="text-center py-10">
          <div className="w-14 h-14 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-3">
            <Coins size={24} className="text-gray-400" />
          </div>
          <div className="text-gray-500 text-sm">暂无持仓批次</div>
          <div className="text-gray-400 text-xs mt-1">点击右上角「买入」开始记录</div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {lots.map((lot) => {
            const lotValue = lot.qty * currentPrice;
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
                    onClick={() => onSellLot(lot)}
                    className="px-3 py-1.5 bg-red-500 text-white text-xs font-semibold rounded-lg hover:bg-red-600 transition-colors"
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
                      {currentPrice > 0 ? `¥${currentPrice.toFixed(2)}` : "-"}
                    </div>
                  </div>
                  <div>
                    <div className="text-[11px] text-gray-500">剩余</div>
                    <div className="text-sm font-bold font-mono text-gray-900">{lot.qty.toFixed(2)} 克</div>
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
  );
}
