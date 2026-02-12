import React, { useState } from "react";
import { UserConfig } from "../types";
import { Button, Input, Select, Modal } from "./ui";

interface TargetModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (config: Omit<UserConfig, "id" | "created_ts">) => Promise<void>;
}

export function TargetModal({ isOpen, onClose, onSubmit }: TargetModalProps) {
  const [targetPrice, setTargetPrice] = useState("");
  const [targetCmp, setTargetCmp] = useState<"EQ" | "GTE" | "LTE">("GTE");
  const [rise1, setRise1] = useState("");
  const [rise2, setRise2] = useState("");
  const [rise3, setRise3] = useState("");
  const [fall1, setFall1] = useState("");
  const [fall2, setFall2] = useState("");
  const [fall3, setFall3] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await onSubmit({
        symbol: 'AU9999',
        created_by: 'default_user',
        target_price: targetPrice ? parseFloat(targetPrice) : undefined,
        target_alert: targetPrice ? 1 : 0,
        target_cmp: targetCmp,
        rise_1: rise1 ? parseFloat(rise1) : undefined,
        rise_2: rise2 ? parseFloat(rise2) : undefined,
        rise_3: rise3 ? parseFloat(rise3) : undefined,
        fall_1: fall1 ? parseFloat(fall1) : undefined,
        fall_2: fall2 ? parseFloat(fall2) : undefined,
        fall_3: fall3 ? parseFloat(fall3) : undefined,
      });
      onClose();
      // Reset form
      setTargetPrice("");
      setRise1("");
      setRise2("");
      setRise3("");
      setFall1("");
      setFall2("");
      setFall3("");
    } catch (error) {
      console.error(error);
      alert("设置失败");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="设置目标价与告警">
      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="border-b border-gray-200 pb-4">
          <h4 className="text-sm font-bold text-gray-900 mb-3">目标价设置</h4>
          
          <div className="space-y-3">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">目标价格 (元/克)</label>
              <Input
                type="number"
                step="0.01"
                value={targetPrice}
                onChange={(e) => setTargetPrice(e.target.value)}
                placeholder="例如: 580.00"
              />
            </div>

            {targetPrice && (
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
            )}
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
            {loading ? "设置中..." : "确认设置"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
