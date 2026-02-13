import React, { useState } from "react";
import { Button, Input, Select, Modal } from "./ui";

interface UserTarget {
  id: number;
  symbol: string;
  target_price: number;
  target_alert: number;
  target_cmp: string;
  created_ts: number;
  updated_ts: number;
}

interface TargetModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (target: { symbol: string; target_price: number; target_cmp: string }) => Promise<void>;
  existingTarget?: UserTarget;
}

export function TargetModal({ isOpen, onClose, onSubmit, existingTarget }: TargetModalProps) {
  const [targetPrice, setTargetPrice] = useState("");
  const [targetCmp, setTargetCmp] = useState<"EQ" | "GTE" | "LTE">("GTE");
  const [loading, setLoading] = useState(false);

  React.useEffect(() => {
    if (isOpen && existingTarget) {
      setTargetPrice(existingTarget.target_price.toString());
      setTargetCmp(existingTarget.target_cmp as "EQ" | "GTE" | "LTE");
    } else if (isOpen && !existingTarget) {
      setTargetPrice("");
      setTargetCmp("GTE");
    }
  }, [isOpen, existingTarget]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetPrice) {
      alert("请输入目标价格");
      return;
    }
    
    setLoading(true);
    try {
      await onSubmit({
        symbol: 'AU',
        target_price: parseFloat(targetPrice),
        target_cmp: targetCmp,
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
    <Modal isOpen={isOpen} onClose={onClose} title={existingTarget ? "修改目标价" : "添加目标价"}>
      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">目标价格 (元/克)</label>
          <Input
            type="number"
            step="0.01"
            value={targetPrice}
            onChange={(e) => setTargetPrice(e.target.value)}
            placeholder="例如: 580.00"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">触发条件</label>
          <Select
            value={targetCmp}
            onChange={(e) => setTargetCmp(e.target.value as "EQ" | "GTE" | "LTE")}
          >
            <option value="GTE">价格 ≥ 目标价时提醒</option>
            <option value="LTE">价格 ≤ 目标价时提醒</option>
            <option value="EQ">价格 = 目标价时提醒</option>
          </Select>
        </div>

        <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-sm text-amber-800">
          <p className="text-xs">目标价触发后会自动关闭提醒，如需继续监控请重新设置。</p>
        </div>

        <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-gray-200">
          <Button type="button" variant="ghost" onClick={onClose}>取消</Button>
          <Button type="submit" disabled={loading}>
            {loading ? (existingTarget ? "修改中..." : "添加中...") : (existingTarget ? "确认修改" : "确认添加")}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
