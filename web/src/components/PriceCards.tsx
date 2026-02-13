interface PriceCardsProps {
  latestPrice: number;
  latestXauPrice: number;
  priceChange: number;
  priceChangePercent: number;
  highPrice: number;
  lowPrice: number;
  priceRange: number;
}

export function PriceCards({
  latestPrice,
  latestXauPrice,
  priceChange,
  priceChangePercent,
  highPrice,
  lowPrice,
  priceRange,
}: PriceCardsProps) {
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

      {/* 24h High Card */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
        <div className="text-sm font-medium text-gray-500 mb-3">24小时最高</div>
        <div className="text-4xl font-bold text-gray-900 mb-2 font-mono">
          ¥{highPrice.toFixed(2)}
        </div>
        <div className="text-sm text-gray-600">
          距当前 +¥{(highPrice - latestPrice).toFixed(2)}
        </div>
      </div>

      {/* 24h Low Card */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
        <div className="text-sm font-medium text-gray-500 mb-3">24小时最低</div>
        <div className="text-4xl font-bold text-gray-900 mb-2 font-mono">
          ¥{lowPrice.toFixed(2)}
        </div>
        <div className="text-sm text-gray-600">
          距当前 -¥{(latestPrice - lowPrice).toFixed(2)}
        </div>
      </div>

      {/* 24h Range Card */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
        <div className="text-sm font-medium text-gray-500 mb-3">24小时振幅</div>
        <div className="text-4xl font-bold text-gray-900 mb-2 font-mono">
          ¥{priceRange.toFixed(2)}
        </div>
        <div className="text-sm text-gray-600">
          波动率 {((priceRange / lowPrice) * 100).toFixed(2)}%
        </div>
      </div>
    </div>
  );
}
