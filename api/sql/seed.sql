-- 种子数据：用于本地开发测试

-- 清空现有数据
DELETE FROM prices WHERE source = 'seed';
DELETE FROM daily_prices WHERE symbol = 'AU';
DELETE FROM trades WHERE symbol = 'AU';
DELETE FROM holdings WHERE symbol = 'AU';
DELETE FROM user_targets WHERE symbol = 'AU';
DELETE FROM alerts WHERE created_by = 'user';
DELETE FROM reports WHERE symbol = 'AU';

-- 插入一些历史价格数据（最近24小时）
INSERT INTO prices (symbol, ts, price, xau_price, source) VALUES
('AU', strftime('%s', 'now', '-24 hours'), 580.50, 2650.00, 'seed'),
('AU', strftime('%s', 'now', '-23 hours'), 581.20, 2652.50, 'seed'),
('AU', strftime('%s', 'now', '-22 hours'), 580.80, 2651.00, 'seed'),
('AU', strftime('%s', 'now', '-21 hours'), 582.30, 2655.00, 'seed'),
('AU', strftime('%s', 'now', '-20 hours'), 583.10, 2658.00, 'seed'),
('AU', strftime('%s', 'now', '-19 hours'), 582.50, 2656.50, 'seed'),
('AU', strftime('%s', 'now', '-18 hours'), 581.90, 2654.00, 'seed'),
('AU', strftime('%s', 'now', '-17 hours'), 583.50, 2660.00, 'seed'),
('AU', strftime('%s', 'now', '-16 hours'), 584.20, 2663.00, 'seed'),
('AU', strftime('%s', 'now', '-15 hours'), 583.80, 2661.50, 'seed'),
('AU', strftime('%s', 'now', '-14 hours'), 582.60, 2657.00, 'seed'),
('AU', strftime('%s', 'now', '-13 hours'), 583.90, 2662.00, 'seed'),
('AU', strftime('%s', 'now', '-12 hours'), 584.50, 2665.00, 'seed'),
('AU', strftime('%s', 'now', '-11 hours'), 585.10, 2668.00, 'seed'),
('AU', strftime('%s', 'now', '-10 hours'), 584.80, 2666.50, 'seed'),
('AU', strftime('%s', 'now', '-9 hours'), 585.50, 2670.00, 'seed'),
('AU', strftime('%s', 'now', '-8 hours'), 586.20, 2673.00, 'seed'),
('AU', strftime('%s', 'now', '-7 hours'), 585.90, 2671.50, 'seed'),
('AU', strftime('%s', 'now', '-6 hours'), 586.50, 2674.00, 'seed'),
('AU', strftime('%s', 'now', '-5 hours'), 587.10, 2677.00, 'seed'),
('AU', strftime('%s', 'now', '-4 hours'), 586.80, 2675.50, 'seed'),
('AU', strftime('%s', 'now', '-3 hours'), 587.50, 2679.00, 'seed'),
('AU', strftime('%s', 'now', '-2 hours'), 588.20, 2682.00, 'seed'),
('AU', strftime('%s', 'now', '-1 hours'), 587.90, 2680.50, 'seed');

-- 插入每日价格数据（最近7天）
INSERT INTO daily_prices (symbol, day_ts, max_price, min_price, max_ts, min_ts, last_updated) VALUES
('AU', strftime('%s', 'now', '-7 days', 'start of day'), 582.50, 578.20, strftime('%s', 'now', '-7 days', '+14 hours'), strftime('%s', 'now', '-7 days', '+2 hours'), strftime('%s', 'now', '-7 days')),
('AU', strftime('%s', 'now', '-6 days', 'start of day'), 583.80, 579.50, strftime('%s', 'now', '-6 days', '+15 hours'), strftime('%s', 'now', '-6 days', '+3 hours'), strftime('%s', 'now', '-6 days')),
('AU', strftime('%s', 'now', '-5 days', 'start of day'), 585.20, 580.90, strftime('%s', 'now', '-5 days', '+16 hours'), strftime('%s', 'now', '-5 days', '+1 hours'), strftime('%s', 'now', '-5 days')),
('AU', strftime('%s', 'now', '-4 days', 'start of day'), 584.50, 581.30, strftime('%s', 'now', '-4 days', '+13 hours'), strftime('%s', 'now', '-4 days', '+4 hours'), strftime('%s', 'now', '-4 days')),
('AU', strftime('%s', 'now', '-3 days', 'start of day'), 586.80, 582.10, strftime('%s', 'now', '-3 days', '+17 hours'), strftime('%s', 'now', '-3 days', '+2 hours'), strftime('%s', 'now', '-3 days')),
('AU', strftime('%s', 'now', '-2 days', 'start of day'), 587.50, 583.20, strftime('%s', 'now', '-2 days', '+15 hours'), strftime('%s', 'now', '-2 days', '+5 hours'), strftime('%s', 'now', '-2 days')),
('AU', strftime('%s', 'now', '-1 days', 'start of day'), 588.90, 584.50, strftime('%s', 'now', '-1 days', '+16 hours'), strftime('%s', 'now', '-1 days', '+3 hours'), strftime('%s', 'now', '-1 days'));

-- 插入一些交易记录
INSERT INTO trades (ts, symbol, side, price, qty, note) VALUES
(strftime('%s', 'now', '-10 days'), 'AU', '买', 575.50, 10, '首次建仓'),
(strftime('%s', 'now', '-5 days'), 'AU', '买', 580.20, 5, '加仓'),
(strftime('%s', 'now', '-2 days'), 'AU', '卖', 586.50, 3, '部分止盈');

-- 插入用户目标价
INSERT INTO user_targets (symbol, target_price, target_alert, target_cmp, created_ts, updated_ts) VALUES
('AU', 590.00, 1, 'GTE', strftime('%s', 'now'), strftime('%s', 'now')),
('AU', 575.00, 1, 'LTE', strftime('%s', 'now'), strftime('%s', 'now'));

-- 插入一些告警记录
INSERT INTO alerts (ts, symbol, created_by, alert_type, base_type, node_level, price, ref_price, change_percent, status) VALUES
(strftime('%s', 'now', '-3 hours'), 'AU', 'user', 'RISE', 'YESTERDAY', 1, 586.50, 584.50, 1.05, 'sent'),
(strftime('%s', 'now', '-1 hours'), 'AU', 'user', 'RISE', 'YESTERDAY', 2, 588.20, 584.50, 2.15, 'sent');

-- 插入一些 AI 报告
INSERT INTO reports (ts, symbol, alert_id, price, context, model, report_md, status) VALUES
(strftime('%s', 'now', '-3 hours'), 'AU', 1, 586.50, '价格突破昨日收盘价1%', 'glm-4', '## 市场分析\n\n当前金价上涨1.05%，突破昨日收盘价。市场情绪偏多。', 'success'),
(strftime('%s', 'now', '-1 hours'), 'AU', 2, 588.20, '价格突破昨日收盘价2%', 'glm-4', '## 市场分析\n\n金价持续上涨，涨幅达2.15%。建议关注回调风险。', 'success');
