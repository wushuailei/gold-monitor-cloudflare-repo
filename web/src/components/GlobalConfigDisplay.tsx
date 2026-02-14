import { GlobalConfig } from "../lib/api";

interface GlobalConfigDisplayProps {
  globalConfig: GlobalConfig | null;
  onEdit: () => void;
}

export function GlobalConfigDisplay({ globalConfig, onEdit }: GlobalConfigDisplayProps) {
  if (!globalConfig) return null;

  const isMarketOpen = globalConfig.market_status === 'OPEN';

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <h3 className="text-lg font-bold text-gray-900">全局配置</h3>
          <div className={`px-3 py-1 rounded-full text-xs font-semibold ${
            isMarketOpen 
              ? 'bg-green-100 text-green-700' 
              : 'bg-gray-100 text-gray-700'
          }`}>
            {isMarketOpen ? '🟢 开盘中' : '⚫ 已停盘'}
          </div>
        </div>
        <button
          onClick={onEdit}
          className="px-3 py-1.5 text-sm font-medium text-purple-600 hover:bg-purple-50 rounded-lg transition-colors"
        >
          修改配置
        </button>
      </div>
      <div className="grid grid-cols-2 gap-4 text-sm">
        <div className="p-3 bg-red-50 rounded-lg">
          <div className="font-medium text-red-900 mb-2">涨幅告警节点</div>
          <div className="text-red-700">
            {[globalConfig.rise_1, globalConfig.rise_2, globalConfig.rise_3]
              .filter(Boolean)
              .map((v) => `${v}%`)
              .join(" / ") || "未设置"}
          </div>
        </div>
        <div className="p-3 bg-green-50 rounded-lg">
          <div className="font-medium text-green-900 mb-2">跌幅告警节点</div>
          <div className="text-green-700">
            {[globalConfig.fall_1, globalConfig.fall_2, globalConfig.fall_3]
              .filter(Boolean)
              .map((v) => `${v}%`)
              .join(" / ") || "未设置"}
          </div>
        </div>
      </div>
    </div>
  );
}
