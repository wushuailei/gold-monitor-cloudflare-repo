import { DailyPrice } from "../types";
import { formatBeijingDate } from "../utils/time";
import { Calendar, TrendingUp, TrendingDown, CircleDot, CircleStop } from "lucide-react";

interface DailyPriceListProps {
  dailyPrices: DailyPrice[];
}

export function DailyPriceList({ dailyPrices }: DailyPriceListProps) {
  if (dailyPrices.length === 0) {
    return (
      <div>
        <h3 className="text-lg font-bold text-gray-900 mb-4">日线汇总</h3>
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mb-3">
            <Calendar size={28} className="text-gray-400" />
          </div>
          <div className="text-gray-500 text-sm">暂无日线数据</div>
        </div>
      </div>
    );
  }

  const sortedPrices = [...dailyPrices].sort((a, b) => b.day_ts - a.day_ts);

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-amber-100 to-orange-100 flex items-center justify-center">
            <Calendar size={20} className="text-amber-600" />
          </div>
          <h3 className="text-lg font-bold text-gray-900">日线汇总</h3>
        </div>
        <div className="text-sm text-gray-500 font-medium">{dailyPrices.length} 天数据</div>
      </div>
      
      <div className="overflow-x-auto max-h-[600px] overflow-y-auto">
        <table className="w-full">
          <thead className="sticky top-0 bg-white z-10">
            <tr className="border-b border-gray-200">
              <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">日期</th>
              <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">品种</th>
              <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">开盘价</th>
              <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">收盘价</th>
              <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">最高价</th>
              <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">最低价</th>
              <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">振幅</th>
            </tr>
          </thead>
          <tbody>
            {sortedPrices.map((daily) => {
              const range = daily.max_price - daily.min_price;
              const changeAmount = daily.open_price && daily.close_price 
                ? daily.close_price - daily.open_price 
                : null;
              const changePercent = daily.open_price && daily.close_price && daily.open_price > 0
                ? ((daily.close_price - daily.open_price) / daily.open_price) * 100
                : null;
              
              return (
                <tr key={daily.id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                  <td className="py-3 px-4 text-sm text-gray-900 font-medium">
                    {formatBeijingDate(daily.day_ts, "yyyy-MM-dd")}
                  </td>
                  <td className="py-3 px-4">
                    <span className="px-2 py-1 bg-amber-100 text-amber-700 text-xs font-semibold rounded">
                      {daily.symbol}
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    {daily.open_price != null ? (
                      <div>
                        <div className="flex items-center gap-2">
                          <CircleDot size={14} className="text-blue-500" />
                          <span className="font-mono font-semibold text-gray-900">¥{daily.open_price.toFixed(2)}</span>
                        </div>
                        {daily.open_ts && (
                          <div className="text-xs text-gray-500 mt-0.5">
                            {formatBeijingDate(daily.open_ts, "HH:mm")}
                          </div>
                        )}
                      </div>
                    ) : (
                      <span className="text-gray-400 text-sm">-</span>
                    )}
                  </td>
                  <td className="py-3 px-4">
                    {daily.close_price != null ? (
                      <div>
                        <div className="flex items-center gap-2">
                          <CircleStop size={14} className="text-purple-500" />
                          <span className="font-mono font-semibold text-gray-900">¥{daily.close_price.toFixed(2)}</span>
                        </div>
                        {daily.close_ts && (
                          <div className="text-xs text-gray-500 mt-0.5">
                            {formatBeijingDate(daily.close_ts, "HH:mm")}
                          </div>
                        )}
                        {changeAmount != null && (
                          <div className={`text-xs mt-0.5 ${changeAmount >= 0 ? 'text-red-600' : 'text-green-600'}`}>
                            {changeAmount >= 0 ? '+' : ''}{changeAmount.toFixed(2)} ({changePercent?.toFixed(2)}%)
                          </div>
                        )}
                      </div>
                    ) : (
                      <span className="text-gray-400 text-sm">-</span>
                    )}
                  </td>
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-2">
                      <TrendingUp size={16} className="text-red-500" />
                      <span className="font-mono font-semibold text-gray-900">¥{daily.max_price.toFixed(2)}</span>
                    </div>
                    <div className="text-xs text-gray-500 mt-0.5">
                      {formatBeijingDate(daily.max_ts, "HH:mm")}
                    </div>
                  </td>
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-2">
                      <TrendingDown size={16} className="text-green-500" />
                      <span className="font-mono font-semibold text-gray-900">¥{daily.min_price.toFixed(2)}</span>
                    </div>
                    <div className="text-xs text-gray-500 mt-0.5">
                      {formatBeijingDate(daily.min_ts, "HH:mm")}
                    </div>
                  </td>
                  <td className="py-3 px-4">
                    <span className="font-mono font-semibold text-gray-900">¥{range.toFixed(2)}</span>
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
