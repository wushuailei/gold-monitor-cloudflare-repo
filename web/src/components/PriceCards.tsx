import { DailyPrice } from "../types";

interface PriceCardsProps {
  latestPrice: number;
  latestXauPrice: number;
  priceChange: number;
  priceChangePercent: number;
  yesterdayDaily?: DailyPrice;
}

export function PriceCards({
  latestPrice,
  latestXauPrice,
  priceChange,
  priceChangePercent,
  yesterdayDaily,
}: PriceCardsProps) {
  const yesterdayHigh = yesterdayDaily?.max_price;
  const yesterdayLow = yesterdayDaily?.min_price;
  const yesterdayOpen = yesterdayDaily?.open_price;
  const yesterdayClose = yesterdayDaily?.close_price;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {/* Current Price Card */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
        <div className="flex items-center justify-between mb-3">
          <div className="text-sm font-medium text-gray-500">国内金价 (AU9999)</div>
          <div
            className={`px-2.5 py-1 rounded-lg text-xs font-bold ${
              priceChange >= 0
                ? "bg-red-100 text-red-700"
                : "bg-green-100 text-green-700"
            }`}
          >
            {priceChange >= 0 ? "↑" : "↓"} {Math.abs(priceChangePercent).toFixed(2)}%
          </div>
        </div>
        <div className="text-4xl font-bold text-gray-900 mb-2 font-mono">
          ¥{latestPrice.toFixed(2)}
        </div>
        <div
          className={`text-sm font-semibold ${priceChange >= 0 ? "text-red-600" : "text-green-600"}`}
        >
          {priceChange >= 0 ? "+" : ""}
          {priceChange.toFixed(2)} 元/克
        </div>
        {latestXauPrice > 0 && (
          <div className="text-xs text-gray-500 mt-2">
            国际金价: ${latestXauPrice.toFixed(2)}/盎司
          </div>
        )}
      </div>

      {/* Yesterday High Card */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
        <div className="text-sm font-medium text-gray-500 mb-3">昨日最高</div>
        {yesterdayHigh != null ? (
          <>
            <div className="text-4xl font-bold text-red-600 mb-2 font-mono">
              ¥{yesterdayHigh.toFixed(2)}
            </div>
            <div className="text-sm text-gray-600">
              距当前 {latestPrice > yesterdayHigh ? "+" : "-"}¥{Math.abs(latestPrice - yesterdayHigh).toFixed(2)}
            </div>
          </>
        ) : (
          <div className="text-2xl text-gray-400">暂无数据</div>
        )}
      </div>

      {/* Yesterday Low Card */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
        <div className="text-sm font-medium text-gray-500 mb-3">昨日最低</div>
        {yesterdayLow != null ? (
          <>
            <div className="text-4xl font-bold text-green-600 mb-2 font-mono">
              ¥{yesterdayLow.toFixed(2)}
            </div>
            <div className="text-sm text-gray-600">
              距当前 {latestPrice >= yesterdayLow ? "+" : "-"}¥{Math.abs(latestPrice - yesterdayLow).toFixed(2)}
            </div>
          </>
        ) : (
          <div className="text-2xl text-gray-400">暂无数据</div>
        )}
      </div>

      {/* Yesterday Open/Close Card */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
        <div className="text-sm font-medium text-gray-500 mb-3">昨日开/收盘</div>
        {yesterdayOpen != null || yesterdayClose != null ? (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">开盘</span>
              <span className="text-xl font-bold text-gray-900 font-mono">
                {yesterdayOpen != null ? `¥${yesterdayOpen.toFixed(2)}` : "-"}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">收盘</span>
              <div className="text-right">
                <div className={`text-xl font-bold font-mono ${
                  yesterdayOpen != null && yesterdayClose != null && yesterdayClose >= yesterdayOpen 
                    ? "text-red-600" 
                    : "text-green-600"
                }`}>
                  {yesterdayClose != null ? `¥${yesterdayClose.toFixed(2)}` : "-"}
                </div>
                {yesterdayOpen != null && yesterdayClose != null && (
                  <div className={`text-xs ${
                    yesterdayClose >= yesterdayOpen ? "text-red-500" : "text-green-500"
                  }`}>
                    {yesterdayClose >= yesterdayOpen ? "+" : ""}{((yesterdayClose - yesterdayOpen) / yesterdayOpen * 100).toFixed(2)}%
                  </div>
                )}
              </div>
            </div>
          </div>
        ) : (
          <div className="text-2xl text-gray-400">暂无数据</div>
        )}
      </div>
    </div>
  );
}
