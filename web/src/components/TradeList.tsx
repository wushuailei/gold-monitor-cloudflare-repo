import { format } from "date-fns";
import { Trade } from "../types";
import { TrendingUp, TrendingDown, Coins } from "lucide-react";

interface TradeListProps {
  trades: Trade[];
  currentPrice?: number;
}

export function TradeList({ trades, currentPrice = 0 }: TradeListProps) {
  if (trades.length === 0) {
    return (
      <div>
        <h3 className="text-lg font-bold text-gray-900 mb-4">交易记录</h3>
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mb-3">
            <Coins size={28} className="text-gray-400" />
          </div>
          <div className="text-gray-500 text-sm">暂无交易记录</div>
        </div>
      </div>
    );
  }

  // 按时间倒序排列
  const sortedTrades = [...trades].sort((a, b) => b.ts - a.ts);

  // 计算总收益
  const buyTrades = trades.filter(t => t.side === '买');
  const sellTrades = trades.filter(t => t.side === '卖');
  
  const totalBuyAmount = buyTrades.reduce((sum, t) => sum + (t.price * (t.qty || 0)), 0);
  const totalBuyQty = buyTrades.reduce((sum, t) => sum + (t.qty || 0), 0);
  const avgBuyPrice = totalBuyQty > 0 ? totalBuyAmount / totalBuyQty : 0;
  
  const totalSellAmount = sellTrades.reduce((sum, t) => sum + (t.price * (t.qty || 0)), 0);
  const totalSellQty = sellTrades.reduce((sum, t) => sum + (t.qty || 0), 0);
  
  const holdingQty = totalBuyQty - totalSellQty;
  const realizedProfit = totalSellAmount - (sellTrades.reduce((sum, t) => sum + (avgBuyPrice * (t.qty || 0)), 0));
  const unrealizedProfit = holdingQty > 0 && currentPrice > 0 ? (currentPrice - avgBuyPrice) * holdingQty : 0;
  const totalProfit = realizedProfit + unrealizedProfit;

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-green-100 to-blue-100 flex items-center justify-center">
            <Coins size={20} className="text-green-600" />
          </div>
          <h3 className="text-lg font-bold text-gray-900">交易记录</h3>
        </div>
        <div className="text-sm text-gray-500 font-medium">{trades.length} 笔交易</div>
      </div>

      {/* 收益统计卡片 */}
      {totalBuyQty > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
          <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg p-4 border border-blue-200">
            <div className="text-xs text-blue-600 font-medium mb-1">持仓数量</div>
            <div className="text-2xl font-bold text-blue-900">{holdingQty.toFixed(2)} 克</div>
            <div className="text-xs text-blue-600 mt-1">平均成本 ¥{avgBuyPrice.toFixed(2)}</div>
          </div>
          
          <div className={`rounded-lg p-4 border ${
            unrealizedProfit >= 0 
              ? 'bg-gradient-to-br from-red-50 to-red-100 border-red-200' 
              : 'bg-gradient-to-br from-green-50 to-green-100 border-green-200'
          }`}>
            <div className={`text-xs font-medium mb-1 ${unrealizedProfit >= 0 ? 'text-red-600' : 'text-green-600'}`}>
              浮动盈亏
            </div>
            <div className={`text-2xl font-bold ${unrealizedProfit >= 0 ? 'text-red-900' : 'text-green-900'}`}>
              {unrealizedProfit >= 0 ? '+' : ''}¥{unrealizedProfit.toFixed(2)}
            </div>
            <div className={`text-xs mt-1 ${unrealizedProfit >= 0 ? 'text-red-600' : 'text-green-600'}`}>
              {holdingQty > 0 && currentPrice > 0 && (
                <>每克 {unrealizedProfit >= 0 ? '+' : ''}¥{((currentPrice - avgBuyPrice)).toFixed(2)}</>
              )}
            </div>
          </div>

          <div className={`rounded-lg p-4 border ${
            realizedProfit >= 0 
              ? 'bg-gradient-to-br from-red-50 to-red-100 border-red-200' 
              : 'bg-gradient-to-br from-green-50 to-green-100 border-green-200'
          }`}>
            <div className={`text-xs font-medium mb-1 ${realizedProfit >= 0 ? 'text-red-600' : 'text-green-600'}`}>
              已实现盈亏
            </div>
            <div className={`text-2xl font-bold ${realizedProfit >= 0 ? 'text-red-900' : 'text-green-900'}`}>
              {realizedProfit >= 0 ? '+' : ''}¥{realizedProfit.toFixed(2)}
            </div>
            <div className={`text-xs mt-1 ${realizedProfit >= 0 ? 'text-red-600' : 'text-green-600'}`}>
              已卖出 {totalSellQty.toFixed(2)} 克
            </div>
          </div>

          <div className={`rounded-lg p-4 border ${
            totalProfit >= 0 
              ? 'bg-gradient-to-br from-red-50 to-red-100 border-red-200' 
              : 'bg-gradient-to-br from-green-50 to-green-100 border-green-200'
          }`}>
            <div className={`text-xs font-medium mb-1 ${totalProfit >= 0 ? 'text-red-600' : 'text-green-600'}`}>
              总盈亏
            </div>
            <div className={`text-2xl font-bold ${totalProfit >= 0 ? 'text-red-900' : 'text-green-900'}`}>
              {totalProfit >= 0 ? '+' : ''}¥{totalProfit.toFixed(2)}
            </div>
            <div className={`text-xs mt-1 ${totalProfit >= 0 ? 'text-red-600' : 'text-green-600'}`}>
              {avgBuyPrice > 0 && ((totalProfit / totalBuyAmount) * 100).toFixed(2)}% 收益率
            </div>
          </div>
        </div>
      )}
      
      <div className="overflow-x-auto max-h-[600px] overflow-y-auto">
        <table className="w-full">
          <thead className="sticky top-0 bg-white z-10">
            <tr className="border-b border-gray-200">
              <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">时间</th>
              <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">类型</th>
              <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">品种</th>
              <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">价格</th>
              <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">数量</th>
              <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">金额</th>
              <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">备注</th>
            </tr>
          </thead>
          <tbody>
            {sortedTrades.map((trade) => {
              const amount = trade.qty ? trade.price * trade.qty : 0;
              return (
                <tr key={trade.id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                  <td className="py-3 px-4 text-sm text-gray-600">
                    {format(trade.ts * 1000, "MM月dd日 HH:mm")}
                  </td>
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-2">
                      {trade.side === "买" ? (
                        <>
                          <TrendingUp size={18} className="text-green-500" />
                          <span className="px-2 py-1 bg-green-100 text-green-700 text-xs font-semibold rounded">
                            买入
                          </span>
                        </>
                      ) : (
                        <>
                          <TrendingDown size={18} className="text-red-500" />
                          <span className="px-2 py-1 bg-red-100 text-red-700 text-xs font-semibold rounded">
                            卖出
                          </span>
                        </>
                      )}
                    </div>
                  </td>
                  <td className="py-3 px-4">
                    <span className="px-2 py-1 bg-amber-100 text-amber-700 text-xs font-semibold rounded">
                      {trade.symbol}
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    <span className="font-mono font-semibold text-gray-900">¥{trade.price.toFixed(2)}</span>
                  </td>
                  <td className="py-3 px-4 text-sm text-gray-600">
                    {trade.qty ? `${trade.qty} 克` : '-'}
                  </td>
                  <td className="py-3 px-4">
                    {amount > 0 ? (
                      <span className="font-mono font-semibold text-gray-900">¥{amount.toFixed(2)}</span>
                    ) : '-'}
                  </td>
                  <td className="py-3 px-4 text-sm text-gray-600">
                    {trade.note || '-'}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
