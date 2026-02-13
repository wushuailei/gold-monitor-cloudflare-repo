import { RefreshCw, TrendingUp, Settings, Send, Plus, DollarSign } from "lucide-react";

interface HeaderProps {
  loading: boolean;
  onRefresh: () => void;
  onOpenGlobalConfig: () => void;
  onOpenTest: () => void;
  onOpenAddTarget: () => void;
  onOpenAddTrade: () => void;
}

export function Header({
  loading,
  onRefresh,
  onOpenGlobalConfig,
  onOpenTest,
  onOpenAddTarget,
  onOpenAddTrade,
}: HeaderProps) {
  return (
    <header className="bg-white border-b border-gray-200 sticky top-0 z-50 shadow-sm">
      <div className="max-w-[1800px] mx-auto px-8 h-16 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center shadow-sm">
              <TrendingUp className="text-white" size={18} strokeWidth={2.5} />
            </div>
            <div>
              <h1 className="text-lg font-bold text-gray-900">黄金价格监控</h1>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={onRefresh}
            className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
            title="刷新数据"
          >
            <RefreshCw size={18} className={loading ? "animate-spin" : ""} />
          </button>
          <button
            onClick={onOpenGlobalConfig}
            className="px-4 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition-colors font-medium text-sm flex items-center gap-2 shadow-sm"
            title="全局配置"
          >
            <Settings size={16} />
            全局配置
          </button>
          <button
            onClick={onOpenTest}
            className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors font-medium text-sm flex items-center gap-2 shadow-sm"
            title="测试发送"
          >
            <Send size={16} />
            测试发送
          </button>
          <button
            onClick={onOpenAddTrade}
            className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors font-medium text-sm flex items-center gap-2 shadow-sm"
            title="记录交易"
          >
            <DollarSign size={16} />
            记录交易
          </button>
          <button
            onClick={onOpenAddTarget}
            className="px-4 py-2 bg-amber-500 text-white rounded-lg hover:bg-amber-600 transition-colors font-medium text-sm flex items-center gap-2 shadow-sm"
          >
            <Plus size={16} /> 添加目标价
          </button>
        </div>
      </div>
    </header>
  );
}
