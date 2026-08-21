import React, { useState, useEffect, useRef } from "react";
import { Trade, HoldingLot } from "../types";
import { Button, Input, Modal, Select } from "./ui";

// datetime-local 输入框用的本地时间格式 "YYYY-MM-DDTHH:mm"
function toLocalInputValue(ts: number): string {
  const d = new Date(ts * 1000);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

interface TradeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (trade: Omit<Trade, "id">) => Promise<void>;
  initialData?: Partial<Trade>;
  lots?: HoldingLot[]; // 持仓批次，卖出时用于选择批次
  currentPrice?: number; // 当前金价，用于默认填入卖出价
  initialLotId?: number; // 卖出时预选的批次 id
}

export function TradeModal({ isOpen, onClose, onSubmit, initialData, lots = [], currentPrice = 0, initialLotId }: TradeModalProps) {
  const [side, setSide] = useState<"买" | "卖">("买");
  const [price, setPrice] = useState("");
  const [qty, setQty] = useState("");
  const [ts, setTs] = useState("");
  const [note, setNote] = useState("");
  const [lotId, setLotId] = useState("");
  const [loading, setLoading] = useState(false);

  // 只在弹窗「打开瞬间」初始化一次，避免 currentPrice/lots 刷新时覆盖用户已填写的内容
  const prevOpenRef = useRef(false);
  useEffect(() => {
    const justOpened = isOpen && !prevOpenRef.current;
    prevOpenRef.current = isOpen;

    if (!justOpened) return;

    if (initialData) {
        setSide((initialData.side || "买") as "买" | "卖");
        setPrice(initialData.price?.toString() || (initialData.side === "卖" && currentPrice > 0 ? currentPrice.toString() : ""));
        setQty(initialData.qty?.toString() || "");
        setTs(initialData.ts ? toLocalInputValue(initialData.ts) : toLocalInputValue(Math.floor(Date.now() / 1000)));
        setNote(initialData.note || "");
    } else {
        setSide("买");
        setPrice(currentPrice > 0 ? currentPrice.toString() : "");
        setQty("");
        setNote("");
        setTs(toLocalInputValue(Math.floor(Date.now() / 1000)));
    }
    // 优先使用调用方预选的批次，否则默认第一个批次
    if (initialLotId && lots.some((l) => l.id === initialLotId)) {
      setLotId(String(initialLotId));
    } else {
      setLotId(lots.length > 0 ? String(lots[0].id) : "");
    }
  }, [isOpen, initialData, currentPrice, initialLotId]);

  const amount = price && qty && parseFloat(price) > 0 && parseFloat(qty) > 0
    ? (parseFloat(price) * parseFloat(qty)).toFixed(2)
    : "";

  // 卖出时：当前选择批次的成本价
  const selectedLot = lots.find((l) => String(l.id) === lotId);
  // 卖出时：预计已实现盈亏 = (卖出价 - 批次成本价) * 克数
  const estimatedPnl = side === "卖" && selectedLot && price && qty
    && parseFloat(price) > 0 && parseFloat(qty) > 0
    ? (parseFloat(price) - selectedLot.cost_price) * parseFloat(qty)
    : null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!price || parseFloat(price) <= 0 || !qty || parseFloat(qty) <= 0) {
      alert("请输入有效的克价和克数");
      return;
    }
    if (side === "卖" && !lotId) {
      alert("请选择要卖出的持仓批次");
      return;
    }
    
    // 时间可选：为空则默认当前时间
    const tradeTs = ts ? Math.floor(new Date(ts).getTime() / 1000) : Math.floor(Date.now() / 1000);
    setLoading(true);
    try {
      await onSubmit({
        ts: tradeTs,
        symbol: 'AU',
        price: parseFloat(price),
        side,
        qty: parseFloat(qty),
        note: note || undefined,
        lot_id: side === "卖" ? parseInt(lotId) : undefined,
      });
      onClose();
      setSide("买");
      setPrice("");
      setQty("");
      setNote("");
    } catch (error: any) {
      console.error(error);
      alert(error?.message?.replace(/^Error: /, "") || "提交失败");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`记录${side === "买" ? "买入" : "卖出"}`}>
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
          <label className="block text-sm font-semibold text-gray-700 mb-2">克价 (元/克)</label>
          <Input
            type="number"
            step="0.01"
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            required
            placeholder="例如: 580.50"
          />
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">克数 (克)</label>
          <Input
            type="number"
            step="0.01"
            value={qty}
            onChange={(e) => setQty(e.target.value)}
            required
            placeholder="例如: 10"
          />
        </div>

        {side === "卖" && (
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">卖出批次</label>
            {lots.length > 0 ? (
              <Select value={lotId} onChange={(e) => setLotId(e.target.value)}>
                {lots.map((lot) => (
                  <option key={lot.id} value={lot.id}>
                    买入于 {new Date(lot.bought_ts * 1000).toLocaleDateString("zh-CN")} · 成本 ¥{lot.cost_price.toFixed(2)} · 剩余 {lot.qty} 克
                    {lot.note ? ` · ${lot.note}` : ""}
                  </option>
                ))}
              </Select>
            ) : (
              <div className="px-3 py-2.5 rounded-lg bg-gray-50 border border-gray-200 text-sm text-gray-500">
                暂无持仓批次，请先买入
              </div>
            )}
          </div>
        )}

        {side === "卖" && selectedLot && (
          <div className={`rounded-lg p-3 border ${
            estimatedPnl !== null && estimatedPnl >= 0
              ? "bg-red-50 border-red-200"
              : estimatedPnl !== null
                ? "bg-green-50 border-green-200"
                : "bg-gray-50 border-gray-200"
          }`}>
            <div className="text-xs text-gray-500 mb-1">该笔预计实盈 = (卖出价 − 批次成本 ¥{selectedLot.cost_price.toFixed(2)}) × 克数</div>
            <div className={`text-xl font-bold font-mono ${
              estimatedPnl !== null && estimatedPnl >= 0 ? "text-red-600" : "text-green-600"
            }`}>
              {estimatedPnl !== null ? `${estimatedPnl >= 0 ? "+" : ""}¥${estimatedPnl.toFixed(2)}` : "-"}
            </div>
          </div>
        )}

        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">成交金额 (元)</label>
          <Input
            type="text"
            value={amount || "-"}
            disabled
            className="bg-gray-50 text-gray-600 font-mono"
          />
          <div className="text-xs text-gray-500 mt-1">金额 = 克价 × 克数</div>
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">时间（可选，默认当前时间）</label>
          <Input
            type="datetime-local"
            value={ts}
            onChange={(e) => setTs(e.target.value)}
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
          <Button type="submit" disabled={loading || !price || parseFloat(price) <= 0 || !qty || parseFloat(qty) <= 0}>
            {loading ? "保存中..." : "保存交易"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
