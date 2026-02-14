import React, { useState, useEffect } from "react";
import { Trade } from "../types";
import { Button, Input, Modal } from "./ui";

interface TradeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (trade: Omit<Trade, "id">) => Promise<void>;
  initialData?: Partial<Trade>;
}

export function TradeModal({ isOpen, onClose, onSubmit, initialData }: TradeModalProps) {
  const [side, setSide] = useState<"买" | "卖">("买");
  const [price, setPrice] = useState("");
  const [qty, setQty] = useState("");
  const [amount, setAmount] = useState("");
  const [ts, setTs] = useState("");
  const [note, setNote] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen && initialData) {
        setSide((initialData.side || "买") as "买" | "卖");
        setPrice(initialData.price?.toString() || "");
        setQty(initialData.qty?.toString() || "");
        const calculatedAmount = initialData.price && initialData.qty 
          ? (initialData.price * initialData.qty).toFixed(2)
          : "";
        setAmount(calculatedAmount);
        // initialData.ts 是毫秒
        setTs(initialData.ts ? new Date(initialData.ts).toISOString().slice(0, 16) : new Date().toISOString().slice(0, 16));
        setNote(initialData.note || "");
    } else if (isOpen) {
        setTs(new Date().toISOString().slice(0, 16));
    }
  }, [isOpen, initialData]);

  // 当价格或数量变化时，自动计算金额
  const handlePriceChange = (value: string) => {
    setPrice(value);
    if (value && qty) {
      const calculatedAmount = (parseFloat(value) * parseFloat(qty)).toFixed(2);
      setAmount(calculatedAmount);
    } else {
      setAmount("");
    }
  };

  const handleQtyChange = (value: string) => {
    setQty(value);
    if (price && value) {
      const calculatedAmount = (parseFloat(price) * parseFloat(value)).toFixed(2);
      setAmount(calculatedAmount);
    } else {
      setAmount("");
    }
  };

  // 当金额变化时，根据价格自动计算数量
  const handleAmountChange = (value: string) => {
    setAmount(value);
    if (value && price) {
      const calculatedQty = (parseFloat(value) / parseFloat(price)).toFixed(2);
      setQty(calculatedQty);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await onSubmit({
        ts: Math.floor(new Date(ts).getTime() / 1000),
        symbol: 'AU',
        price: parseFloat(price),
        side,
        qty: parseFloat(qty),
        note: note || undefined,
      });
      onClose();
      // Reset form
      setSide("买");
      setPrice("");
      setQty("");
      setAmount("");
      setNote("");
    } catch (error) {
      console.error(error);
      alert("提交失败");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="记录交易">
      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-3">交易类型</label>
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => setSide("买")}
              className={`px-4 py-3 rounded-lg font-semibold transition-all border ${
                side === "买" 
                  ? "bg-green-500 text-white border-green-500 shadow-sm" 
                  : "bg-white text-gray-700 border-gray-300 hover:bg-gray-50"
              }`}
            >
              买入
            </button>
            <button
              type="button"
              onClick={() => setSide("卖")}
              className={`px-4 py-3 rounded-lg font-semibold transition-all border ${
                side === "卖" 
                  ? "bg-red-500 text-white border-red-500 shadow-sm" 
                  : "bg-white text-gray-700 border-gray-300 hover:bg-gray-50"
              }`}
            >
              卖出
            </button>
          </div>
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">价格 (元/克)</label>
          <Input
            type="number"
            step="0.01"
            value={price}
            onChange={(e) => handlePriceChange(e.target.value)}
            required
            placeholder="例如: 580.50"
          />
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">金额 (元)</label>
          <Input
            type="number"
            step="0.01"
            value={amount}
            onChange={(e) => handleAmountChange(e.target.value)}
            placeholder="输入金额自动计算数量"
          />
          <div className="text-xs text-gray-500 mt-1">可输入金额自动计算数量，或直接输入数量</div>
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">数量 (克)</label>
          <Input
            type="number"
            step="0.01"
            value={qty}
            onChange={(e) => handleQtyChange(e.target.value)}
            required
            placeholder="例如: 10"
          />
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">时间</label>
          <Input
            type="datetime-local"
            value={ts}
            onChange={(e) => setTs(e.target.value)}
            required
          />
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">备注（可选）</label>
          <Input
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="添加交易备注..."
          />
        </div>

        <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-gray-200">
          <Button type="button" variant="ghost" onClick={onClose}>取消</Button>
          <Button type="submit" disabled={loading}>
            {loading ? "保存中..." : "保存交易"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
