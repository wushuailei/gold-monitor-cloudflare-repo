import React, { useState, useEffect } from "react";
import { Button, Input, Modal } from "./ui";

interface GlobalConfig {
  id: number;
  symbol: string;
  rise_1?: number;
  rise_2?: number;
  rise_3?: number;
  fall_1?: number;
  fall_2?: number;
  fall_3?: number;
  market_status?: string;
}

interface GlobalConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (config: Omit<GlobalConfig, "id">) => Promise<void>;
  currentConfig?: GlobalConfig;
}

export function GlobalConfigModal({ isOpen, onClose, onSubmit, currentConfig }: GlobalConfigModalProps) {
  const [marketStatus, setMarketStatus] = useState<"OPEN" | "CLOSED">("OPEN");
  const [rise1, setRise1] = useState("");
  const [rise2, setRise2] = useState("");
  const [rise3, setRise3] = useState("");
  const [fall1, setFall1] = useState("");
  const [fall2, setFall2] = useState("");
  const [fall3, setFall3] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen && currentConfig) {
      setMarketStatus((currentConfig.market_status as "OPEN" | "CLOSED") || "OPEN");
      setRise1(currentConfig.rise_1?.toString() || "");
      setRise2(currentConfig.rise_2?.toString() || "");
      setRise3(currentConfig.rise_3?.toString() || "");
      setFall1(currentConfig.fall_1?.toString() || "");
      setFall2(currentConfig.fall_2?.toString() || "");
      setFall3(currentConfig.fall_3?.toString() || "");
    }
  }, [isOpen, currentConfig]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await onSubmit({
        symbol: 'AU',
        market_status: marketStatus,
        rise_1: rise1 ? parseFloat(rise1) : undefined,
        rise_2: rise2 ? parseFloat(rise2) : undefined,
        rise_3: rise3 ? parseFloat(rise3) : undefined,
        fall_1: fall1 ? parseFloat(fall1) : undefined,
        fall_2: fall2 ? parseFloat(fall2) : undefined,
        fall_3: fall3 ? parseFloat(fall3) : undefined,
      });
      onClose();
    } catch (error) {
      console.error(error);
      alert("设置失败");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="全局配置">
      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-sm text-blue-800">
          <p className="font-medium mb-1">💡 全局配置说明</p>
          <p className="text-xs">此配置对所有用户生效，包括市场状态和涨跌幅告警节点。</p>
        </div>

        <div className="border-b border-gray-200 pb-4">
          <h4 className="text-sm font-bold text-gray-900 mb-3">市场状态</h4>
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => setMarketStatus("OPEN")}
              className={`px-4 py-3 rounded-lg font-semibold transition-all border ${
                marketStatus === "OPEN" 
                  ? "bg-green-500 text-white border-green-500 shadow-sm" 
                  : "bg-white text-gray-700 border-gray-300 hover:bg-gray-50"
              }`}
            >
              🟢 开盘
            </button>
            <button
              type="button"
              onClick={() => setMarketStatus("CLOSED")}
              className={`px-4 py-3 rounded-lg font-semibold transition-all border ${
                marketStatus === "CLOSED" 
                  ? "bg-gray-500 text-white border-gray-500 shadow-sm" 
                  : "bg-white text-gray-700 border-gray-300 hover:bg-gray-50"
              }`}
            >
              ⚫ 停盘
            </button>
          </div>
          <div className="text-xs text-gray-500 mt-2">
            停盘时将暂停价格抓取和告警推送
          </div>
        </div>

        <div className="border-b border-gray-200 pb-4">
          <h4 className="text-sm font-bold text-gray-900 mb-3">涨幅告警节点 (%)</h4>
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">一级</label>
              <Input
                type="number"
                step="0.01"
                value={rise1}
                onChange={(e) => setRise1(e.target.value)}
                placeholder="1.0"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">二级</label>
              <Input
                type="number"
                step="0.01"
                value={rise2}
                onChange={(e) => setRise2(e.target.value)}
                placeholder="2.0"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">三级</label>
              <Input
                type="number"
                step="0.01"
                value={rise3}
                onChange={(e) => setRise3(e.target.value)}
                placeholder="3.0"
              />
            </div>
          </div>
        </div>

        <div>
          <h4 className="text-sm font-bold text-gray-900 mb-3">跌幅告警节点 (%)</h4>
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">一级</label>
              <Input
                type="number"
                step="0.01"
                value={fall1}
                onChange={(e) => setFall1(e.target.value)}
                placeholder="1.0"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">二级</label>
              <Input
                type="number"
                step="0.01"
                value={fall2}
                onChange={(e) => setFall2(e.target.value)}
                placeholder="2.0"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">三级</label>
              <Input
                type="number"
                step="0.01"
                value={fall3}
                onChange={(e) => setFall3(e.target.value)}
                placeholder="3.0"
              />
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-gray-200">
          <Button type="button" variant="ghost" onClick={onClose}>取消</Button>
          <Button type="submit" disabled={loading}>
            {loading ? "保存中..." : "保存配置"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
