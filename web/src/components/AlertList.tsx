import { format } from "date-fns";
import { Alert } from "../types";
import { Bell, TrendingUp, TrendingDown, Target } from "lucide-react";

interface AlertListProps {
  alerts: Alert[];
}

export function AlertList({ alerts }: AlertListProps) {
  const getAlertTypeInfo = (alertType: string, _baseType: string, nodeLevel: number) => {
    if (alertType === 'TARGET') {
      return {
        icon: <Target size={18} className="text-blue-500" />,
        badge: <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs font-semibold rounded">目标价</span>,
        label: '目标价触发'
      };
    }
    
    if (alertType === 'RISE') {
      const levelText = nodeLevel === 1 ? '一级' : nodeLevel === 2 ? '二级' : nodeLevel === 3 ? '三级' : '';
      return {
        icon: <TrendingUp size={18} className="text-red-500" />,
        badge: <span className="px-2 py-1 bg-red-100 text-red-700 text-xs font-semibold rounded">涨幅{levelText}</span>,
        label: `涨幅${levelText}告警`
      };
    }
    
    if (alertType === 'FALL') {
      const levelText = nodeLevel === 1 ? '一级' : nodeLevel === 2 ? '二级' : nodeLevel === 3 ? '三级' : '';
      return {
        icon: <TrendingDown size={18} className="text-green-500" />,
        badge: <span className="px-2 py-1 bg-green-100 text-green-700 text-xs font-semibold rounded">跌幅{levelText}</span>,
        label: `跌幅${levelText}告警`
      };
    }
    
    return {
      icon: <Bell size={18} className="text-gray-500" />,
      badge: <span className="px-2 py-1 bg-gray-100 text-gray-700 text-xs font-semibold rounded">其他</span>,
      label: '告警'
    };
  };

  const getBaseTypeText = (baseType: string) => {
    switch (baseType) {
      case 'YESTERDAY': return '昨日收盘';
      case 'BUY': return '买入价';
      case 'TARGET': return '目标价';
      default: return baseType;
    }
  };

  if (alerts.length === 0) {
    return (
      <div>
        <h3 className="text-lg font-bold text-gray-900 mb-4">告警记录</h3>
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mb-3">
            <Bell size={28} className="text-gray-400" />
          </div>
          <div className="text-gray-500 text-sm">暂无告警记录</div>
        </div>
      </div>
    );
  }

  return (
    <div>
      <h3 className="text-lg font-bold text-gray-900 mb-4">告警记录</h3>
      <div className="overflow-x-auto max-h-[600px] overflow-y-auto">
        <table className="w-full">
          <thead className="sticky top-0 bg-white z-10">
            <tr className="border-b border-gray-200">
              <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">时间</th>
              <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">类型</th>
              <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">对比基准</th>
              <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">当前价格</th>
              <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">基准价格</th>
              <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">涨跌幅</th>
            </tr>
          </thead>
          <tbody>
            {alerts.map((alert) => {
              const typeInfo = getAlertTypeInfo(alert.alert_type, alert.base_type, alert.node_level);
              return (
                <tr key={alert.id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                  <td className="py-3 px-4 text-sm text-gray-600">
                    {format(alert.ts * 1000, "MM-dd HH:mm")}
                  </td>
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-2">
                      {typeInfo.icon}
                      {typeInfo.badge}
                    </div>
                  </td>
                  <td className="py-3 px-4 text-sm text-gray-600">
                    {getBaseTypeText(alert.base_type)}
                  </td>
                  <td className="py-3 px-4">
                    <span className="font-mono font-semibold text-gray-900">¥{alert.price.toFixed(2)}</span>
                  </td>
                  <td className="py-3 px-4">
                    {alert.ref_price && (
                      <span className="font-mono text-sm text-gray-600">¥{alert.ref_price.toFixed(2)}</span>
                    )}
                  </td>
                  <td className="py-3 px-4">
                    {alert.change_percent !== undefined && (
                      <span className={`font-semibold text-sm ${alert.change_percent >= 0 ? 'text-red-600' : 'text-green-600'}`}>
                        {alert.change_percent >= 0 ? '+' : ''}{alert.change_percent.toFixed(2)}%
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
