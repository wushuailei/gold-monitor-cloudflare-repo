import { PriceLevel } from "../types";
import { formatBeijingDate } from "../utils/time";
import { TrendingUp, TrendingDown, Layers } from "lucide-react";

interface PriceLevelListProps {
  priceLevels: PriceLevel[];
}

export function PriceLevelList({ priceLevels }: PriceLevelListProps) {
  if (priceLevels.length === 0) {
    return (
      <div>
        <h3 className="text-lg font-bold text-gray-900 mb-4">关口记录</h3>
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mb-3">
            <Layers size={28} className="text-gray-400" />
          </div>
          <div className="text-gray-500 text-sm">暂无关口记录</div>
        </div>
      </div>
    );
  }

  const sortedLevels = [...priceLevels].sort((a, b) => b.ts - a.ts);

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-purple-100 to-pink-100 flex items-center justify-center">
            <Layers size={20} className="text-purple-600" />
          </div>
          <h3 className="text-lg font-bold text-gray-900">关口记录</h3>
        </div>
        <div className="text-sm text-gray-500 font-medium">{priceLevels.length} 条记录</div>
      </div>

      <div className="overflow-x-auto max-h-[400px] overflow-y-auto">
        <table className="w-full">
          <thead className="sticky top-0 bg-white z-10">
            <tr className="border-b border-gray-200">
              <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">时间</th>
              <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">关口</th>
              <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">方向</th>
              <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">当时价格</th>
              <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">状态</th>
            </tr>
          </thead>
          <tbody>
            {sortedLevels.map((level) => {
              const isUp = level.direction === "UP";
              return (
                <tr key={level.id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                  <td className="py-3 px-4 text-sm text-gray-600">
                    {formatBeijingDate(level.ts, "MM月dd日 HH:mm")}
                  </td>
                  <td className="py-3 px-4">
                    <span className="font-mono font-bold text-gray-900">¥{level.price_level}</span>
                  </td>
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-2">
                      {isUp ? (
                        <>
                          <TrendingUp size={18} className="text-red-500" />
                          <span className="px-2 py-1 bg-red-100 text-red-700 text-xs font-semibold rounded">
                            突破
                          </span>
                        </>
                      ) : (
                        <>
                          <TrendingDown size={18} className="text-green-500" />
                          <span className="px-2 py-1 bg-green-100 text-green-700 text-xs font-semibold rounded">
                            跌破
                          </span>
                        </>
                      )}
                    </div>
                  </td>
                  <td className="py-3 px-4">
                    <span className="font-mono text-gray-900">¥{level.price.toFixed(2)}</span>
                  </td>
                  <td className="py-3 px-4">
                    {level.status === "SENT" ? (
                      <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs font-semibold rounded">
                        已发送
                      </span>
                    ) : (
                      <span className="px-2 py-1 bg-red-100 text-red-700 text-xs font-semibold rounded">
                        失败
                      </span>
                    )}
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
