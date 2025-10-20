Growth Momentum & Factor Ratios Prototypes

这个目录包含两个原型的 FastEXPR 模板和一个可运行的 Python 回测脚本（带合成数据测试），用于快速验证因子/组合表现。

文件说明
- `prototypes/fastexpr_templates.txt`：两个 FastEXPR 模板（Growth Momentum, Factor Ratios），把字段 id 替换为平台上的字段 id 即可提交回测。
- `prototypes/backtest_growth_and_factor.py`：Python 回测脚本，使用 pandas 做点时序对齐、计算因子分数、分组回测与 IC 统计。脚本在没有输入数据时会生成合成数据并执行回测，适合做语法与逻辑验证。
- `prototypes/requirements.txt`：推荐 Python 依赖（pandas, numpy）。

使用说明
1. 若使用平台数据：将平台导出的 CSV（列应包含 date, ticker, price, ttm_revenue, eps, cashflow_op 等）替换脚本加载部分。
2. 若使用 FastEXPR：参照 `fastexpr_templates.txt` 填入对应字段 id 并提交到平台回测。

如需要，我可以把脚本改为直接调用 MCP 数据接口拉取样本数据并跑回测（需授权/平台 token）。