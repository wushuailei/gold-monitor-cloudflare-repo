import { useState } from "react";
import { X, Send, AlertTriangle, Sparkles, CheckCircle, XCircle } from "lucide-react";
import { api } from "../lib/api";

interface TestModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

type TestType = "feishu" | "alert" | "ai-report";

export function TestModal({ isOpen, onClose, onSuccess }: TestModalProps) {
  const [selectedTest, setSelectedTest] = useState<TestType>("feishu");
  const [testing, setTesting] = useState(false);
  const [result, setResult] = useState<{ success: boolean; message: string } | null>(null);

  if (!isOpen) return null;

  const handleTest = async () => {
    setTesting(true);
    setResult(null);

    try {
      let response: { success: boolean; message: string };

      switch (selectedTest) {
        case "feishu":
          response = await api.testFeishu();
          break;
        case "alert":
          response = await api.testAlert();
          break;
        case "ai-report":
          response = await api.testDailyReport();
          break;
      }

      setResult(response);
      if (response.success && onSuccess) {
        setTimeout(() => {
          onSuccess();
        }, 1000);
      }
    } catch (err) {
      setResult({
        success: false,
        message: String(err),
      });
    } finally {
      setTesting(false);
    }
  };

  const handleClose = () => {
    setResult(null);
    onClose();
  };

  const testOptions = [
    {
      type: "feishu" as TestType,
      icon: Send,
      title: "测试飞书消息",
      description: "发送一条测试消息到飞书群，验证 Webhook 配置",
      color: "blue",
    },
    {
      type: "alert" as TestType,
      icon: AlertTriangle,
      title: "测试告警消息",
      description: "发送一条模拟告警消息到飞书群",
      color: "orange",
    },
    {
      type: "ai-report" as TestType,
      icon: Sparkles,
      title: "测试 AI 分析报告",
      description: "生成并发送完整的市场分析报告（消耗 AI 额度）",
      color: "purple",
    },
  ];

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between rounded-t-xl">
          <h2 className="text-xl font-bold text-gray-900">测试发送</h2>
          <button
            onClick={handleClose}
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Test Options */}
          <div className="space-y-3">
            <label className="block text-sm font-semibold text-gray-700 mb-3">
              选择测试类型
            </label>
            {testOptions.map((option) => {
              const Icon = option.icon;
              const isSelected = selectedTest === option.type;
              const colorClasses = {
                blue: {
                  border: "border-blue-500",
                  bg: "bg-blue-50",
                  icon: "text-blue-600",
                  ring: "ring-blue-500",
                },
                orange: {
                  border: "border-orange-500",
                  bg: "bg-orange-50",
                  icon: "text-orange-600",
                  ring: "ring-orange-500",
                },
                purple: {
                  border: "border-purple-500",
                  bg: "bg-purple-50",
                  icon: "text-purple-600",
                  ring: "ring-purple-500",
                },
              }[option.color] || {
                border: "border-gray-500",
                bg: "bg-gray-50",
                icon: "text-gray-600",
                ring: "ring-gray-500",
              };

              return (
                <button
                  key={option.type}
                  onClick={() => setSelectedTest(option.type)}
                  className={`w-full p-4 rounded-lg border-2 transition-all text-left ${
                    isSelected
                      ? `${colorClasses.border} ${colorClasses.bg} ring-2 ${colorClasses.ring} ring-opacity-50`
                      : "border-gray-200 hover:border-gray-300 hover:bg-gray-50"
                  }`}
                >
                  <div className="flex items-start gap-4">
                    <div
                      className={`w-12 h-12 rounded-lg flex items-center justify-center flex-shrink-0 ${
                        isSelected ? colorClasses.bg : "bg-gray-100"
                      }`}
                    >
                      <Icon
                        size={24}
                        className={isSelected ? colorClasses.icon : "text-gray-600"}
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold text-gray-900 mb-1">
                        {option.title}
                      </div>
                      <div className="text-sm text-gray-600">
                        {option.description}
                      </div>
                    </div>
                    {isSelected && (
                      <div className="flex-shrink-0">
                        <CheckCircle size={20} className={colorClasses.icon} />
                      </div>
                    )}
                  </div>
                </button>
              );
            })}
          </div>

          {/* Result Display */}
          {result && (
            <div
              className={`p-4 rounded-lg border-2 ${
                result.success
                  ? "bg-green-50 border-green-500"
                  : "bg-red-50 border-red-500"
              }`}
            >
              <div className="flex items-start gap-3">
                {result.success ? (
                  <CheckCircle size={24} className="text-green-600 flex-shrink-0 mt-0.5" />
                ) : (
                  <XCircle size={24} className="text-red-600 flex-shrink-0 mt-0.5" />
                )}
                <div className="flex-1 min-w-0">
                  <div
                    className={`font-semibold mb-1 ${
                      result.success ? "text-green-900" : "text-red-900"
                    }`}
                  >
                    {result.success ? "测试成功" : "测试失败"}
                  </div>
                  <div
                    className={`text-sm ${
                      result.success ? "text-green-700" : "text-red-700"
                    }`}
                  >
                    {result.message}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Warning for AI Report */}
          {selectedTest === "ai-report" && (
            <div className="p-4 rounded-lg bg-amber-50 border border-amber-200">
              <div className="flex items-start gap-3">
                <AlertTriangle size={20} className="text-amber-600 flex-shrink-0 mt-0.5" />
                <div className="text-sm text-amber-800">
                  <div className="font-semibold mb-1">注意</div>
                  <div>
                    此操作会调用 AI API 并消耗额度，生成的报告会保存到数据库并发送到飞书群。
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 bg-gray-50 border-t border-gray-200 px-6 py-4 flex items-center justify-end gap-3 rounded-b-xl">
          <button
            onClick={handleClose}
            className="px-4 py-2 text-gray-700 hover:bg-gray-200 rounded-lg transition-colors font-medium"
            disabled={testing}
          >
            取消
          </button>
          <button
            onClick={handleTest}
            disabled={testing}
            className={`px-6 py-2 rounded-lg transition-colors font-medium text-white flex items-center gap-2 ${
              testing
                ? "bg-gray-400 cursor-not-allowed"
                : "bg-blue-600 hover:bg-blue-700"
            }`}
          >
            {testing ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                测试中...
              </>
            ) : (
              <>
                <Send size={16} />
                开始测试
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
