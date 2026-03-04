import { TrendingUp, Bell, Coins, Package } from "lucide-react";
import { UserTarget } from "../lib/api";
import { Trade, Alert } from "../types";

interface Holding {
  symbol: string;
  total_qty: number;
  total_cost: number;
  avg_price: number;
  realized_profit: number;
  updated_ts: number;
}

interface StatsCardsProps {
  userTargets: UserTarget[];
  alerts: Alert[];
  trades: Trade[];
  latestPrice: number;
  holdings: Holding | null;
}

export function StatsCards({ userTargets, alerts, trades, latestPrice, holdings }: StatsCardsProps) {
  const totalQty = holdings?.total_qty || 0;
  const avgPrice = holdings?.avg_price || 0;
  const totalCost = holdings?.total_cost || 0;
  const realizedProfit = holdings?.realized_profit || 0;
  const marketValue = totalQty > 0 && latestPrice > 0 ? totalQty * latestPrice : 0;
  const holdingProfit = marketValue - totalCost;
  const holdingProfitPercent = totalCost > 0 ? (holdingProfit / totalCost) * 100 : 0;

  // eslint-disable-next-line react-hooks/purity
  const now = Math.floor(Date.now() / 1000);
  const beijingOffset = 8 * 3600;
  const todayStartBeijing = now - ((now + beijingOffset) % 86400);
  const todayAlerts = alerts.filter(a => a.ts >= todayStartBeijing);

  return (
    <div className="space-y-6">
      {/* 持仓卡片 - 放在最上方 */}
      <div className="grid grid-cols-1 md:grid-cols-6 gap-6">
        {holdings && holdings.total_qty > 0 ? (
          <>
            <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl shadow-sm border border-blue-200 p-6 hover:shadow-md transition-shadow">
              <div className="text-sm font-medium text-blue-600 mb-2">持仓克重</div>
              <div className="text-3xl font-bold text-blue-900">
                {totalQty.toFixed(2)} 克
              </div>
            </div>

            <div className="bg-gradient-to-br from-cyan-50 to-cyan-100 rounded-xl shadow-sm border border-cyan-200 p-6 hover:shadow-md transition-shadow">
              <div className="text-sm font-medium text-cyan-600 mb-2">持仓克均价</div>
              <div className="text-3xl font-bold text-cyan-900">
                ¥{avgPrice.toFixed(2)}
              </div>
            </div>

            <div className={`rounded-xl shadow-sm border p-6 hover:shadow-md transition-shadow ${
              holdingProfit >= 0 
                ? 'bg-gradient-to-br from-red-50 to-red-100 border-red-200' 
                : 'bg-gradient-to-br from-green-50 to-green-100 border-green-200'
            }`}>
              <div className={`text-sm font-medium mb-2 ${holdingProfit >= 0 ? 'text-red-600' : 'text-green-600'}`}>
                持仓收益
              </div>
              <div className={`text-3xl font-bold ${holdingProfit >= 0 ? 'text-red-900' : 'text-green-900'}`}>
                {holdingProfit >= 0 ? '+' : ''}¥{holdingProfit.toFixed(2)}
              </div>
              <div className={`text-xs mt-1 ${holdingProfit >= 0 ? 'text-red-600' : 'text-green-600'}`}>
                {holdingProfitPercent >= 0 ? '+' : ''}{holdingProfitPercent.toFixed(2)}%
              </div>
            </div>

            <div className={`rounded-xl shadow-sm border p-6 hover:shadow-md transition-shadow ${
              realizedProfit >= 0 
                ? 'bg-gradient-to-br from-red-50 to-red-100 border-red-200' 
                : 'bg-gradient-to-br from-green-50 to-green-100 border-green-200'
            }`}>
              <div className={`text-sm font-medium mb-2 ${realizedProfit >= 0 ? 'text-red-600' : 'text-green-600'}`}>
                已实现收益
              </div>
              <div className={`text-3xl font-bold ${realizedProfit >= 0 ? 'text-red-900' : 'text-green-900'}`}>
                {realizedProfit >= 0 ? '+' : ''}¥{realizedProfit.toFixed(2)}
              </div>
            </div>

            <div className="bg-gradient-to-br from-amber-50 to-amber-100 rounded-xl shadow-sm border border-amber-200 p-6 hover:shadow-md transition-shadow">
              <div className="text-sm font-medium text-amber-600 mb-2">持仓市值</div>
              <div className="text-3xl font-bold text-amber-900">
                ¥{marketValue.toFixed(2)}
              </div>
              <div className="text-xs text-amber-600 mt-1">
                当前价 ¥{latestPrice.toFixed(2)}/克
              </div>
            </div>

            <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl shadow-sm border border-purple-200 p-6 hover:shadow-md transition-shadow">
              <div className="text-sm font-medium text-purple-600 mb-2">持仓成本</div>
              <div className="text-3xl font-bold text-purple-900">
                ¥{totalCost.toFixed(2)}
              </div>
            </div>
          </>
        ) : (
          <div className="col-span-6 bg-white rounded-xl shadow-sm border border-gray-200 p-6 text-center">
            <div className="flex items-center justify-center gap-3 text-gray-400">
              <Package size={24} />
              <span className="text-lg font-medium">暂无持仓</span>
            </div>
          </div>
        )}
      </div>

      {/* 其他统计卡片 */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm font-medium text-gray-500 mb-2">活跃目标</div>
              <div className="text-3xl font-bold text-gray-900">
                {userTargets.filter((t) => t.target_alert === 1).length}
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
              <div className="text-3xl font-bold text-gray-900">{todayAlerts.length}</div>
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
      </div>
    </div>
  );
}
