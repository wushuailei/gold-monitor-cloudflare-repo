import { UserTarget } from "../lib/api";

interface TargetManagementProps {
  userTargets: UserTarget[];
  onEdit: (target: UserTarget) => void;
  onDelete: (id: number) => void;
}

export function TargetManagement({ userTargets, onEdit, onDelete }: TargetManagementProps) {
  if (userTargets.length === 0) return null;

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      <h3 className="text-lg font-bold text-gray-900 mb-4">我的目标价</h3>
      <div className="space-y-3">
        {userTargets.map((t) => {
          const isActive = t.target_alert === 1;
          const isAbove = t.target_cmp === "GTE";
          const isBelow = t.target_cmp === "LTE";

          return (
            <div
              key={t.id}
              className="flex items-center justify-between p-4 rounded-lg bg-gray-50 border border-gray-200 hover:border-gray-300 transition-colors"
            >
              <div className="flex-1">
                <div className="flex items-center gap-3">
                  <div
                    className={`px-2.5 py-1 rounded-lg text-xs font-bold ${
                      isActive
                        ? "bg-green-100 text-green-700"
                        : "bg-gray-100 text-gray-500"
                    }`}
                  >
                    {isActive ? "● 活跃" : "○ 已触发"}
                  </div>
                  <div
                    className={`text-lg font-bold font-mono ${
                      isAbove
                        ? "text-blue-600"
                        : isBelow
                          ? "text-orange-600"
                          : "text-purple-600"
                    }`}
                  >
                    {isAbove ? "↑" : isBelow ? "↓" : "="} ¥{t.target_price.toFixed(2)}
                  </div>
                  <div className="text-sm text-gray-500">
                    {isAbove ? "突破提醒" : isBelow ? "跌破提醒" : "到达提醒"}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2 ml-4">
                {isActive && (
                  <button
                    onClick={() => onEdit(t)}
                    className="px-3 py-1.5 text-sm font-medium text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                  >
                    编辑
                  </button>
                )}
                <button
                  onClick={() => onDelete(t.id)}
                  className="px-3 py-1.5 text-sm font-medium text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                >
                  删除
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
