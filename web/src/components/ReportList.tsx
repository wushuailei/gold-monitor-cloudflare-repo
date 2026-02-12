import { format } from "date-fns";
import { Report } from "../types";
import { useState } from "react";
import { Sparkles, Eye } from "lucide-react";

interface ReportListProps {
  reports: Report[];
}

export function ReportList({ reports }: ReportListProps) {
  const [selectedReport, setSelectedReport] = useState<Report | null>(null);

  if (reports.length === 0) {
      return (
        <div>
          <h3 className="text-lg font-bold text-gray-900 mb-4">AI 市场分析</h3>
          <div className="text-center py-12">
            <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-purple-100 to-blue-100 flex items-center justify-center mx-auto mb-4">
              <Sparkles size={28} className="text-purple-600" />
            </div>
            <div className="text-gray-600 text-sm font-medium">暂无 AI 分析报告</div>
            <div className="text-gray-500 text-xs mt-1">报告将在价格剧烈波动时自动生成</div>
          </div>
        </div>
      );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-purple-100 to-blue-100 flex items-center justify-center">
            <Sparkles size={20} className="text-purple-600" />
          </div>
          <h3 className="text-lg font-bold text-gray-900">AI 市场分析</h3>
        </div>
        <div className="text-sm text-gray-500 font-medium">{reports.length} 份报告</div>
      </div>
      
      <div className="overflow-x-auto max-h-[600px] overflow-y-auto">
        <table className="w-full">
          <thead className="sticky top-0 bg-white z-10">
            <tr className="border-b border-gray-200">
              <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">时间</th>
              <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">品种</th>
              <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">模型</th>
              <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">价格</th>
              <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">报告摘要</th>
              <th className="text-center py-3 px-4 text-sm font-semibold text-gray-700">操作</th>
            </tr>
          </thead>
          <tbody>
            {reports.map((report) => (
              <tr key={report.id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                <td className="py-3 px-4 text-sm text-gray-600">
                  {format(report.ts * 1000, "MM月dd日 HH:mm")}
                </td>
                <td className="py-3 px-4">
                  <span className="px-2 py-1 bg-amber-100 text-amber-700 text-xs font-semibold rounded">
                    {report.symbol}
                  </span>
                </td>
                <td className="py-3 px-4">
                  <span className="px-2 py-1 bg-purple-100 text-purple-700 text-xs font-semibold rounded">
                    {report.model}
                  </span>
                </td>
                <td className="py-3 px-4">
                  {report.price && (
                    <span className="font-mono font-semibold text-gray-900">¥{report.price.toFixed(2)}</span>
                  )}
                </td>
                <td className="py-3 px-4 text-sm text-gray-700 max-w-md">
                  <div className="line-clamp-2">{report.report_md}</div>
                </td>
                <td className="py-3 px-4 text-center">
                  <button
                    onClick={() => setSelectedReport(report)}
                    className="inline-flex items-center gap-1 px-3 py-1.5 bg-blue-50 text-blue-600 hover:bg-blue-100 rounded-lg text-xs font-medium transition-colors"
                  >
                    <Eye size={14} />
                    查看
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Report Detail Modal */}
      {selectedReport && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-3xl max-h-[80vh] overflow-hidden border border-gray-200">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between mb-2">
                <h4 className="text-xl font-bold text-gray-900">AI 分析报告</h4>
                <button 
                  onClick={() => setSelectedReport(null)}
                  className="text-gray-400 hover:text-gray-600 hover:bg-gray-100 p-2 rounded-lg transition-colors"
                >
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              <div className="flex items-center gap-3 text-sm text-gray-600">
                <span>{format(selectedReport.ts * 1000, "yyyy-MM-dd HH:mm:ss")}</span>
                <span className="px-2 py-1 bg-amber-100 text-amber-700 text-xs font-semibold rounded">
                  {selectedReport.symbol}
                </span>
                <span className="px-2 py-1 bg-purple-100 text-purple-700 text-xs font-semibold rounded">
                  {selectedReport.model}
                </span>
                {selectedReport.price && (
                  <span className="font-mono font-semibold text-gray-900">¥{selectedReport.price.toFixed(2)}</span>
                )}
              </div>
            </div>
            <div className="p-6 overflow-y-auto max-h-[calc(80vh-120px)]">
              <div className="prose prose-sm max-w-none">
                <div className="whitespace-pre-wrap text-gray-700 leading-relaxed">
                  {selectedReport.report_md}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
