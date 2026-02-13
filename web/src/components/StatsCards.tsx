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
  const unrealizedProfit = holdings && holdings.total_qty > 0 && latestPrice > 0
    ? (latestPrice - holdings.avg_price) * holdings.total_qty
    : 0;
  
  const realizedProfit = holdings?.realized_profit || 0;
  const totalProfit = realizedProfit + unrealizedProfit;

  return (
    <div className="space-y-6">
      {/* 持仓卡片 - 放在最上方 */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
        {holdings && holdings.total_qty > 0 ? (
          <>
            <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl shadow-sm border border-blue-200 p-6 hover:shadow-md transition-shadow">
              <div className="text-sm font-medium text-blue-600 mb-2">持仓数量</div>
              <div className="text-3xl font-bold text-blue-900">
                {holdings.total_qty.toFixed(2)} 克
              </div>
              <div className="text-xs text-blue-600 mt-1">平均成本 ¥{holdings.avg_price.toFixed(2)}</div>
            </div>

            <div className={`rounded-xl shadow-sm border p-6 hover:shadow-md transition-shadow ${
              unrealizedProfit >= 0 
                ? 'bg-gradient-to-br from-red-50 to-red-100 border-red-200' 
                : 'bg-gradient-to-br from-green-50 to-green-100 border-green-200'
            }`}>
              <div className={`text-sm font-medium mb-2 ${unrealizedProfit >= 0 ? 'text-red-600' : 'text-green-600'}`}>
                浮动盈亏
              </div>
              <div className={`text-3xl font-bold ${unrealizedProfit >= 0 ? 'text-red-900' : 'text-green-900'}`}>
                {unrealizedProfit >= 0 ? '+' : ''}¥{unrealizedProfit.toFixed(2)}
              </div>
              <div className={`text-xs mt-1 ${unrealizedProfit >= 0 ? 'text-red-600' : 'text-green-600'}`}>
                {holdings.total_qty > 0 && latestPrice > 0 && holdings.avg_price > 0 && (
                  <>每克 {unrealizedProfit >= 0 ? '+' : ''}¥{((latestPrice - holdings.avg_price)).toFixed(2)}</>
                )}
              </div>
            </div>

            <div className={`rounded-xl shadow-sm border p-6 hover:shadow-md transition-shadow ${
              realizedProfit >= 0 
                ? 'bg-gradient-to-br from-red-50 to-red-100 border-red-200' 
                : 'bg-gradient-to-br from-green-50 to-green-100 border-green-200'
            }`}>
              <div className={`text-sm font-medium mb-2 ${realizedProfit >= 0 ? 'text-red-600' : 'text-green-600'}`}>
                已实现盈亏
              </div>
              <div className={`text-3xl font-bold ${realizedProfit >= 0 ? 'text-red-900' : 'text-green-900'}`}>
                {realizedProfit >= 0 ? '+' : ''}¥{realizedProfit.toFixed(2)}
              </div>
              <div className={`text-xs mt-1 ${realizedProfit >= 0 ? 'text-red-600' : 'text-green-600'}`}>
                所有已平仓交易
              </div>
            </div>

            <div className={`rounded-xl shadow-sm border p-6 hover:shadow-md transition-shadow ${
              totalProfit >= 0 
                ? 'bg-gradient-to-br from-red-50 to-red-100 border-red-200' 
                : 'bg-gradient-to-br from-green-50 to-green-100 border-green-200'
            }`}>
              <div className={`text-sm font-medium mb-2 ${totalProfit >= 0 ? 'text-red-600' : 'text-green-600'}`}>
                总盈亏
              </div>
              <div className={`text-3xl font-bold ${totalProfit >= 0 ? 'text-red-900' : 'text-green-900'}`}>
                {totalProfit >= 0 ? '+' : ''}¥{totalProfit.toFixed(2)}
              </div>
              <div className={`text-xs mt-1 ${totalProfit >= 0 ? 'text-red-600' : 'text-green-600'}`}>
                {holdings.total_cost > 0 && ((totalProfit / holdings.total_cost) * 100).toFixed(2)}% 收益率
              </div>
            </div>

            <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl shadow-sm border border-purple-200 p-6 hover:shadow-md transition-shadow">
              <div className="text-sm font-medium text-purple-600 mb-2">持仓成本</div>
              <div className="text-3xl font-bold text-purple-900">
                ¥{holdings.total_cost.toFixed(2)}
              </div>
            </div>
          </>
        ) : (
          <div className="col-span-5 bg-white rounded-xl shadow-sm border border-gray-200 p-6 text-center">
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
      </div>
    </div>
  );
}
