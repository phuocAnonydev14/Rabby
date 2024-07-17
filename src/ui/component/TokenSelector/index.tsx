import React, { useEffect, useMemo, useState } from 'react';
import { Input, Drawer, Skeleton, Tooltip } from 'antd';
import clsx from 'clsx';
import { useTranslation } from 'react-i18next';
import { useDebounce } from 'react-use';
import TokenWithChain from '../TokenWithChain';
import { TokenItem } from 'background/service/openapi';
import { formatTokenAmount, formatUsdValue } from 'ui/utils/number';
import { getTokenSymbol } from 'ui/utils/token';
import './style.less';
import BigNumber from 'bignumber.js';
import stats from '@/stats';
import { CHAINS_ENUM, Chain } from '@debank/common';
import { findChain, findChainByServerID } from '@/utils/chain';

import MatchImage from 'ui/assets/match.svg';
import IconSearch from 'ui/assets/search.svg';
import { ReactComponent as RcIconChainFilterClose } from 'ui/assets/chain-select/chain-filter-close.svg';
import { ReactComponent as RcIconCloseCC } from 'ui/assets/component/close-cc.svg';
import { isNil } from 'lodash';
import ThemeIcon from '../ThemeMode/ThemeIcon';
import { useWallet } from 'ui/utils';
import { useRabbySelector } from 'ui/store';
import { CONLA, rabbyNetworkName } from '@/utils/const';
import { ethers } from 'ethers';
import getAccountStorage from '@/ui/utils/getAccountStorage';

export const isSwapTokenType = (s: string) =>
  ['swapFrom', 'swapTo'].includes(s);

export interface SearchCallbackCtx {
  chainServerId: Chain['serverId'] | null;
  chainItem: Chain | null | undefined;
}
export interface TokenSelectorProps {
  visible: boolean;
  list: TokenItem[];
  isLoading?: boolean;
  onConfirm(item: TokenItem): void;
  onCancel(): void;
  onSearch(
    ctx: SearchCallbackCtx & {
      keyword: string;
    }
  );
  onRemoveChainFilter?(ctx: SearchCallbackCtx);
  type?: 'default' | 'swapFrom' | 'swapTo';
  placeholder?: string;
  chainId: string;
  disabledTips?: string;
  supportChains?: CHAINS_ENUM[] | undefined;
}

const filterTestnetTokenItem = (token: TokenItem) => {
  return !findChainByServerID(token.chain)?.isTestnet;
};

const TokenSelector = ({
  visible,
  list,
  onConfirm,
  onCancel,
  onSearch,
  onRemoveChainFilter,
  isLoading = false,
  type = 'default',
  placeholder,
  chainId: chainServerId,
  disabledTips,
  supportChains,
}: TokenSelectorProps) => {
  const { t } = useTranslation();
  const [query, setQuery] = useState('');
  const [isInputActive, setIsInputActive] = useState(false);
  const [displayList, setDisplayList] = useState<TokenItem[]>([]);

  const { chainItem, chainSearchCtx, isTestnet } = useMemo(() => {
    const chain = !chainServerId
      ? null
      : findChain({ serverId: chainServerId });
    return {
      chainItem: chain,
      isTestnet: !!chain?.isTestnet,
      chainSearchCtx: {
        chainServerId,
        chainItem: chain,
      },
    };
  }, [chainServerId, visible]);

  const wallet = useWallet();
  const currentAccount = useRabbySelector(
    (state) => state.account.currentAccount
  );

  useEffect(() => {
    setDisplayList((state) => [
      ...state,
      {
        id: rabbyNetworkName,
        chain: rabbyNetworkName,
        name: 'BTC',
        symbol: 'BTC',
        display_symbol: null,
        optimized_symbol: 'BTC',
        decimals: 18,
        logo_url: '',
        price: 0,
        is_verified: true,
        is_core: true,
        is_wallet: true,
        time_at: 0,
        amount: 0,
      },
    ]);
  }, [currentAccount]);

  useDebounce(
    async () => {
      if (!query.trim()) return;
      console.log('query', query);

      if (['b', 't', 'c'].includes(query.trim().toLowerCase())) {
        const accountContractAddr = getAccountStorage(
          currentAccount?.address || ''
        );
        const tokenAmount = await wallet.getAccountContractBalance(
          undefined,
          accountContractAddr
        );
        setDisplayList((state) => [
          // ...state,
          {
            id: rabbyNetworkName,
            chain: rabbyNetworkName,
            name: 'BTC',
            symbol: 'BTC',
            display_symbol: null,
            optimized_symbol: 'BTC',
            decimals: 18,
            logo_url: '',
            price: 0,
            is_verified: true,
            is_core: true,
            is_wallet: true,
            time_at: 0,
            amount: +ethers.utils.formatEther(tokenAmount),
          },
        ]);
      }
      const token = await wallet.getCustomTestnetToken({
        address: currentAccount!.address,
        chainId: CONLA.id,
        tokenId: query.trim(),
      });
      if (token) {
        try {
          await wallet.addCustomTestnetToken({
            chainId: CONLA.id,
            id: query,
            symbol: token!.symbol,
            decimals: token!.decimals,
          });
        } catch (e) {
          console.log(e);
        }
      }
      onSearch({ ...chainSearchCtx, keyword: query });
    },
    150,
    [chainSearchCtx, query]
  );

  const handleQueryChange = (value: string) => {
    setQuery(value);
  };

  const { conlaAcc } = useRabbySelector((state) => state.customRPC);

  useEffect(() => {
    (async () => {
      if (!supportChains?.length) {
        let resultList = list || [];
        if (!chainServerId) return resultList.filter(filterTestnetTokenItem);
        if (conlaAcc) {
          resultList = await Promise.all(
            resultList.map(async (token) => {
              const accountContractAddr = getAccountStorage(
                currentAccount?.address || ''
              );
              const tokenAmount = await wallet.getAccountContractBalance(
                token.id,
                accountContractAddr
              );
              return {
                ...token,
                amount: +ethers.utils.formatEther(tokenAmount),
              };
            })
          );
        }
        setDisplayList(resultList);
      }
    })();
  }, [list, supportChains, chainServerId]);

  // const displayList = useMemo(async () => {
  //   if (!supportChains?.length) {
  //     let resultList = list || [];
  //     if (!chainServerId) return resultList.filter(filterTestnetTokenItem);
  //     if(!conlaAcc) return resultList
  //     resultList = await Promise.all(
  //       resultList.map(async (token) => {
  //         const tokenAmount = await wallet.getAccountContractBalance(token.id)
  //         return {...token,amount:ethers.utils.formatEther(tokenAmount)}
  //       })
  //     );
  //     return resultList;
  //   }

  //   // const varied = (list || []).reduce(
  //   //   (accu, token) => {
  //   //     const chainItem = findChainByServerID(token.chain);
  //   //     const disabled =
  //   //       !!supportChains?.length &&
  //   //       chainItem &&
  //   //       !supportChains.includes(chainItem.enum);

  //   //     if (!disabled) {
  //   //       accu.natural.push(token);
  //   //     } else if (chainItem?.isTestnet && !chainServerId) {
  //   //       accu.ignored.push(token);
  //   //     } else {
  //   //       accu.disabled.push(token);
  //   //     }

  //   //     return accu;
  //   //   },
  //   //   {
  //   //     natural: [] as TokenItem[],
  //   //     disabled: [] as TokenItem[],
  //   //     ignored: [] as TokenItem[],
  //   //   }
  //   // );

  //   return [...varied.natural, ...varied.disabled];
  // }, [list, supportChains, chainServerId]);

  const handleInputFocus = () => {
    setIsInputActive(true);
  };

  const handleInputBlur = () => {
    setIsInputActive(false);
  };

  useEffect(() => {
    if (!visible) {
      setQuery('');
    }
  }, [visible]);

  const isEmpty = list.length <= 0;

  const isSwapType = isSwapTokenType(type);

  const isSearchAddr = useMemo(() => {
    const v = query?.trim() || '';
    return v.length === 42 && v.toLowerCase().startsWith('0x');
  }, [query]);

  const NoDataUI = useMemo(
    () =>
      isLoading ? (
        <div>
          {Array(isSwapType ? 8 : 10)
            .fill(1)
            .map((_, i) => (
              <DefaultLoading key={i} />
            ))}
        </div>
      ) : (
        <div className="no-token w-full">
          <img
            className={
              !query || isSearchAddr
                ? 'w-[100px] h-[100px]'
                : 'w-[52px] h-[52px]'
            }
            src={!query || isSearchAddr ? '/images/nodata-tx.png' : MatchImage}
            alt="no site"
          />

          {!query || isSearchAddr ? (
            <p className="text-r-neutral-foot text-14 mt-12 text-center mb-0">
              {t('component.TokenSelector.noTokens')}
            </p>
          ) : (
            <>
              <p className="text-r-neutral-foot text-14 mt-12 text-center mb-0">
                {t('component.TokenSelector.noMatch')}
              </p>
              <p className="text-r-neutral-foot text-14 mt-0 text-center">
                {/* Try to search contract address on {{ chainName }} */}
                {t('component.TokenSelector.noMatchSuggestion', {
                  chainName:
                    findChain({
                      serverId: chainServerId,
                    })?.name || 'chain',
                })}
              </p>
            </>
          )}
        </div>
      ),
    [isLoading, isSwapType, t, isSearchAddr, chainServerId]
  );

  useEffect(() => {
    if (query && isSwapType && displayList.length === 0) {
      stats.report('swapTokenSearchFailure', {
        chainId: chainServerId,
        searchType: type === 'swapFrom' ? 'fromToken' : 'toToken',
        keyword: query,
      });
    }
  }, [type, query, isSwapType, displayList, query, chainServerId]);

  return (
    <Drawer
      className="token-selector custom-popup is-support-darkmode"
      height="580px"
      placement="bottom"
      visible={visible}
      onClose={onCancel}
      closeIcon={
        <RcIconCloseCC className="w-[20px] h-[20px] text-r-neutral-foot" />
      }
    >
      {/* Select a token */}
      <div className="header">{t('component.TokenSelector.header.title')}</div>
      <div className="input-wrapper">
        <Input
          className={clsx({ active: isInputActive })}
          size="large"
          prefix={<img src={IconSearch} />}
          // Search by Name / Address
          placeholder={
            placeholder ?? t('component.TokenSelector.searchInput.placeholder')
          }
          value={query}
          onChange={(e) => handleQueryChange(e.target.value)}
          autoFocus
          onFocus={handleInputFocus}
          onBlur={handleInputBlur}
        />
      </div>
      <div className="filters-wrapper">
        {chainItem && (
          <>
            <div className="filter-item__chain">
              <img
                className="filter-item__chain-logo"
                src={chainItem.logo}
                alt={chainItem.name}
              />
              <span className="ml-[4px]">{chainItem.name}</span>
              <div
                className="py-4 cursor-pointer"
                onClick={() => {
                  onRemoveChainFilter?.({ chainServerId, chainItem });
                  onSearch({
                    chainItem: null,
                    chainServerId: '',
                    keyword: query,
                  });
                }}
              >
                <ThemeIcon
                  className="filter-item__chain-close w-[12px] h-[12px] ml-[6px]"
                  src={RcIconChainFilterClose}
                />
              </div>
            </div>
          </>
        )}
      </div>

      {!isTestnet ? (
        <ul className={clsx('token-list', { empty: isEmpty })}>
          <li className="token-list__header">
            <div>
              {/* ASSET / AMOUNT */}
              {t('component.TokenSelector.listTableHead.assetAmount.title')}
            </div>
            <div>
              {/* PRICE */}
              {t('component.TokenSelector.listTableHead.price.title')}
            </div>
            <div>
              {/* USD VALUE */}
              {t('component.TokenSelector.listTableHead.usdValue.title')}
            </div>
          </li>
          {isEmpty
            ? NoDataUI
            : [...new Set(displayList)].map((token, index) => {
                const chainItem = findChain({ serverId: token.chain });
                const disabled =
                  !!supportChains?.length &&
                  chainItem &&
                  !supportChains.includes(chainItem.enum);
                if (token.id === displayList[index + 1]?.id) return;

                return (
                  <Tooltip
                    key={`${token.chain}-${token.id}`}
                    trigger={['click', 'hover']}
                    mouseEnterDelay={3}
                    overlayClassName={clsx('rectangle left-[20px]')}
                    placement="top"
                    title={disabledTips}
                    visible={disabled ? undefined : false}
                  >
                    <li
                      className={clsx(
                        'token-list__item h-[52px]',
                        disabled && 'opacity-50'
                      )}
                      onClick={() => !disabled && onConfirm(token)}
                    >
                      <div>
                        <TokenWithChain
                          token={token}
                          width="24px"
                          height="24px"
                          hideConer
                        />
                        <div className="flex flex-col gap-4">
                          <span
                            className="symbol text-13 text-r-neutral-title-1 font-medium"
                            title={token.amount.toString()}
                          >
                            {formatTokenAmount(token.amount)}
                          </span>
                          <span
                            className="symbol"
                            title={getTokenSymbol(token)}
                          >
                            {getTokenSymbol(token)}
                          </span>
                        </div>
                      </div>

                      <div className="flex flex-col gap-4">
                        <div>{formatUsdValue(token.price)}</div>
                        <div>
                          {isNil(token.price_24h_change) ? null : (
                            <div
                              className={clsx('font-normal', {
                                'text-green': token.price_24h_change > 0,
                                'text-red-forbidden':
                                  token.price_24h_change < 0,
                              })}
                            >
                              {token.price_24h_change > 0 ? '+' : ''}
                              {(token.price_24h_change * 100).toFixed(2)}%
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="flex flex-col text-right items-end">
                        <div
                          title={formatUsdValue(
                            new BigNumber(token.price || 0)
                              .times(token.amount)
                              .toFixed()
                          )}
                          className={clsx(
                            'max-w-full text-13 text-r-neutral-title-1',
                            'truncate'
                          )}
                        >
                          {formatUsdValue(
                            new BigNumber(token.price || 0)
                              .times(token.amount)
                              .toFixed()
                          )}
                        </div>
                      </div>
                    </li>
                  </Tooltip>
                );
              })}
        </ul>
      ) : (
        <ul className={clsx('token-list', { empty: isEmpty })}>
          <li className="token-list__header">
            <div>ASSET</div>
            <div>Amount</div>
          </li>
          {isEmpty
            ? NoDataUI
            : [...new Set(displayList)].map((token, index) => {
                const chainItem = findChain({ serverId: token.chain });
                const disabled =
                  !!supportChains?.length &&
                  chainItem &&
                  !supportChains.includes(chainItem.enum);
                if (token.id === displayList[index + 1]?.id) return;
                return (
                  <Tooltip
                    key={`${token.chain}-${token.id}`}
                    trigger={['click', 'hover']}
                    mouseEnterDelay={3}
                    overlayClassName={clsx('rectangle left-[20px]')}
                    placement="top"
                    title={disabledTips}
                    visible={disabled ? undefined : false}
                  >
                    <li
                      className={clsx(
                        'token-list__item h-[52px]',
                        disabled && 'opacity-50'
                      )}
                      onClick={() => !disabled && onConfirm(token)}
                    >
                      <div className="flex items-center gap-[12px]">
                        <TokenWithChain
                          token={token}
                          width="24px"
                          height="24px"
                          hideConer
                        />
                        <div
                          className="text-r-neutral-title1 text-[13px] leading-[15px] font-medium"
                          title={getTokenSymbol(token)}
                        >
                          {getTokenSymbol(token)}
                        </div>
                      </div>

                      <div
                        title={formatTokenAmount(token.amount)}
                        className={clsx(
                          'max-w-full text-r-neutral-title1 text-[13px] leading-[15px] font-medium',
                          'truncate text-right ml-auto w-[150px]'
                        )}
                      >
                        {formatTokenAmount(token.amount)}
                      </div>
                    </li>
                  </Tooltip>
                );
              })}
        </ul>
      )}
    </Drawer>
  );
};

const DefaultLoading = () => (
  <div className="flex justify-between items-center py-10 pl-[20px] pr-[17px]">
    <div className="gap-x-12 flex">
      <Skeleton.Input
        active
        className="rounded-full w-[24px] h-[24px] bg-r-neutral-bg-1"
      />
      <div className="gap-y-2 flex flex-col">
        <Skeleton.Input
          active
          className="bg-r-neutral-bg-1 rounded-[2px] w-[72px] h-[15px]"
        />
        <Skeleton.Input
          active
          className="bg-r-neutral-bg-1 rounded-[2px] w-[44px] h-[10px]"
        />
      </div>
    </div>
    <div>
      <Skeleton.Input
        active
        className="bg-r-neutral-bg-1 rounded-[2px] w-[72px] h-[20px]"
      />
    </div>
    <div>
      <Skeleton.Input
        active
        className="bg-r-neutral-bg-1 rounded-[2px] w-[72px] h-[20px]"
      />
    </div>
  </div>
);

export default TokenSelector;
