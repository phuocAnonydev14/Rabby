import { useCallback, useEffect, useMemo, useState } from 'react';
import { useWallet, useWalletRequest } from 'ui/utils';

import { findChainByServerID, DisplayChainWithWhiteLogo } from '@/utils/chain';
import { filterChainWithBalance, normalizeChainList } from '@/utils/account';
import useConlaAccount from './useConlaAccount';
import { ethers } from 'ethers';
import store, { useRabbySelector } from '../store';

/** @deprecated import from '@/utils/chain' directly  */
export type { DisplayChainWithWhiteLogo };

export default function useCurrentBalance(
  account: string | undefined,
  opts?: {
    noNeedBalance?: boolean;
    update?: boolean;
    /**
     * @description in the future, only nonce >= 0, the fetching will be triggered
     */
    nonce?: number;
    initBalanceFromLocalCache?: boolean;
  }
) {
  const {
    update = false,
    noNeedBalance = false,
    nonce = 0,
    initBalanceFromLocalCache = false,
  } = opts || {};

  const wallet = useWallet();
  const [balance, setBalance] = useState<number | null>(null);
  const [success, setSuccess] = useState(true);
  const [balanceLoading, setBalanceLoading] = useState(true);
  const [balanceFromCache, setBalanceFromCache] = useState(
    initBalanceFromLocalCache
  );
  let isCanceled = false;
  const [matteredChainBalances, setChainBalances] = useState<
    DisplayChainWithWhiteLogo[]
  >([]);

  const [missingList, setMissingList] = useState<string[]>();

  const [getInMemoryAddressBalance] = useWalletRequest(
    wallet.getInMemoryAddressBalance,
    {
      onSuccess({ total_usd_value, chain_list }) {
        if (isCanceled) return;
        setSuccess(true);
        const chainList = normalizeChainList(chain_list);

        setChainBalances(chainList);
        setBalanceLoading(false);
        setBalanceFromCache(false);
      },
      onError(e) {
        setBalanceLoading(false);
        try {
          const { error_code, err_chain_ids } = JSON.parse(e.message);
          if (error_code === 2) {
            const chainNames = err_chain_ids.map((serverId: string) => {
              const chain = findChainByServerID(serverId);
              return chain?.name;
            });
            setMissingList(chainNames);
            setSuccess(true);
            return;
          }
        } catch (e) {
          console.error(e);
        }
        setSuccess(false);
      },
    }
  );

  const { conlaAcc } = useRabbySelector((state) => state.customRPC);

  const getCurrentBalance = async (force = false) => {
    if (!account || noNeedBalance) return;
    setBalanceLoading(true);
    const cacheData = await wallet.getAddressCacheBalance(account);
    let conlaBalance: string;
    if (conlaAcc) {
      const balanceAccountContract = (await wallet.getAccountContractBalance()) as any;
      conlaBalance = ethers.utils.formatEther(balanceAccountContract.hex);
    } else conlaBalance = await wallet.getConchaBalance(account);
    const apiLevel = await wallet.getAPIConfig([], 'ApiLevel', false);
    if (cacheData) {
      setBalanceFromCache(true);
      // setBalance(cacheData.total_usd_value);
      const chainList = normalizeChainList(cacheData.chain_list);
      setChainBalances(chainList);

      if (update) {
        if (apiLevel < 2) {
          // setBalanceLoading(true);
          await getInMemoryAddressBalance(account, force);
        } else {
          setBalanceLoading(false);
        }
      } else {
        setBalanceLoading(false);
      }
    } else {
      if (apiLevel < 2) {
        await getInMemoryAddressBalance(account, force);
        setBalanceLoading(false);
        setBalanceFromCache(false);
      } else {
        setBalanceLoading(false);
      }
      store.dispatch.customRPC.setConlaLoading(false);
      setBalance(+conlaBalance);
    }
  };

  const refresh = useCallback(async () => {
    await getCurrentBalance(true);
  }, [getCurrentBalance, conlaAcc]);

  const isCurrentBalanceExpired = useCallback(async () => {
    if (!account) return false;

    try {
      return wallet.isInMemoryAddressBalanceExpired(account.toLowerCase());
    } catch (error) {
      return false;
    }
  }, [account]);

  useEffect(() => {
    // if (nonce < 0) return;
    //
    // getCurrentBalance();
    // if (!noNeedBalance) {
    //   wallet.getAddressCacheBalance(account).then((cache) => {
    //     setChainBalances(cache ? normalizeChainList(cache?.chain_list) : []);
    //   });
    // }
    (async () => {
      try {
        let conlaBalance: string;
        const conlaStorage = localStorage.getItem('conlaAccount');
        if (conlaStorage) {
          const balanceAccountContract = await wallet.getAccountContractBalance();
          conlaBalance = ethers.utils.formatEther(balanceAccountContract.hex);
        } else conlaBalance = await wallet.getConchaBalance(account as string);
        setBalance(+conlaBalance);
        setBalanceLoading(false);
        store.dispatch.customRPC.setConlaLoading(false);
      } catch (e) {
        console.log('conlaBalance error', e);
      }
    })();
    console.log('conla account changed', conlaAcc);
    return () => {
      isCanceled = true;
    };
  }, [account, nonce, conlaAcc]);

  const chainBalancesWithValue = useMemo(() => {
    return filterChainWithBalance(matteredChainBalances);
  }, [matteredChainBalances]);

  return {
    balance,
    matteredChainBalances,
    chainBalancesWithValue,
    isCurrentBalanceExpired,
    // getInMemoryAddressBalance,
    success,
    balanceLoading,
    balanceFromCache,
    refreshBalance: refresh,
    fetchBalance: getCurrentBalance,
    missingList,
  };
}
