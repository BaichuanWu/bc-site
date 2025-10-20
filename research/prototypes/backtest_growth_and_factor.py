"""简单回测脚本（合成数据）
- 生成合成 universe（100 支股票）和 48 个季度的数据
- 计算 Growth Momentum（TTM revenue growth）与 Factor Ratios（基于合成 ratio）
- 每期按 cross-section 排序，计算 decile returns 与 IC
"""

import numpy as np
import pandas as pd
from datetime import datetime

np.random.seed(42)

def generate_synthetic_data(n_tickers=100, n_quarters=48):
    tickers = [f"T{i:03d}" for i in range(n_tickers)]
    dates = pd.date_range(end=pd.Timestamp.today(), periods=n_quarters, freq='Q')
    rows = []
    for date in dates:
        for t in tickers:
            # base price
            price = 20 + np.random.randn() * 2 + np.random.rand() * 10
            # simulated ttm revenue and eps with some persistence
            ttm_revenue = 100 + np.random.randn() * 10 + (date.year - dates[0].year) * np.random.rand()
            eps = max(0.1, np.random.randn() * 0.5 + 2 + (np.random.rand()-0.5))
            cashflow_op = np.random.randn() * 5 + 10
            # synthetic factor ratios (bpemtt-like)
            earnings_yield = np.random.rand() * 0.2  # 0-20%
            grossprofit_to_assets = np.random.rand() * 0.3
            cash_ratio = np.random.rand()
            book_leverage = np.random.rand()
            # future return (next quarter) correlated somewhat with revenue growth and earnings_yield
            future_ret = 0.02 * (earnings_yield*5) + 0.01 * (grossprofit_to_assets*3) + np.random.randn()*0.05
            rows.append((date, t, price, ttm_revenue, eps, cashflow_op, earnings_yield, grossprofit_to_assets, cash_ratio, book_leverage, future_ret))
    df = pd.DataFrame(rows, columns=['date','ticker','price','ttm_revenue','eps','cashflow_op','earnings_yield','grossprofit_to_assets','cash_ratio','book_leverage','future_ret'])
    return df


def compute_growth_score(df):
    df = df.copy()
    # compute TTM revenue growth: compare current ttm_revenue with t-4 quarters (approx 1y)
    df = df.sort_values(['ticker','date'])
    df['ttm_revenue_prev'] = df.groupby('ticker')['ttm_revenue'].shift(4)
    df['rev_growth_12m'] = (df['ttm_revenue'] - df['ttm_revenue_prev']) / df['ttm_revenue_prev'].replace({0:np.nan})
    # cross-sectional zscore per date
    df['rev_growth_z'] = df.groupby('date')['rev_growth_12m'].transform(lambda x: (x - x.mean())/x.std(ddof=0))
    return df


def compute_factor_score(df):
    df = df.copy()
    # standardized ranks for each ratio (1..N)
    for col in ['earnings_yield','grossprofit_to_assets','cash_ratio','book_leverage']:
        # if book_leverage lower is better, we will invert later
        df[col+'_rank'] = df.groupby('date')[col].transform(lambda x: x.rank(pct=True))
    # invert book_leverage rank
    df['book_leverage_rank_inv'] = 1 - df['book_leverage_rank']
    df['combined_score'] = df[['earnings_yield_rank','grossprofit_to_assets_rank','cash_ratio_rank','book_leverage_rank_inv']].mean(axis=1)
    return df


def decile_returns_and_ic(df, score_col='rev_growth_z'):
    df = df.copy()
    # compute next-quarter return as target (we have it in synthetic 'future_ret')
    df['date_next'] = df.groupby('ticker')['date'].shift(-1)
    # For each date, compute decile returns
    dates = sorted(df['date'].unique())[:-1]
    decile_rets = []
    ic_list = []
    for d in dates:
        sub = df[df['date']==d]
        sub = sub.dropna(subset=[score_col,'future_ret'])
        if len(sub) < 20:
            continue
        sub['decile'] = pd.qcut(sub[score_col], 10, labels=False, duplicates='drop')
        grp = sub.groupby('decile')['future_ret'].mean()
        decile_rets.append(grp)
        # IC: spearman between score and future_ret
        ic = sub[[score_col,'future_ret']].corr(method='spearman').iloc[0,1]
        ic_list.append(ic)
    decile_df = pd.DataFrame(decile_rets)
    return decile_df.mean(), np.nanmean(ic_list)


if __name__ == '__main__':
    df = generate_synthetic_data()
    print('Synthetic data shape:', df.shape)

    # Growth Momentum
    dg = compute_growth_score(df)
    decile_mean, ic_mean = decile_returns_and_ic(dg, score_col='rev_growth_z')
    print('\nGrowth Momentum: mean decile returns (top=9, bottom=0):')
    print(decile_mean)
    print('Mean Spearman IC:', ic_mean)

    # Factor Ratios
    df2 = compute_factor_score(df)
    decile_mean2, ic_mean2 = decile_returns_and_ic(df2, score_col='combined_score')
    print('\nFactor Ratios: mean decile returns:')
    print(decile_mean2)
    print('Mean Spearman IC:', ic_mean2)
