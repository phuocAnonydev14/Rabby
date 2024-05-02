import { useRabbyDispatch, useRabbySelector } from '@/ui/store';
import {
  getCurrentConnectSite,
  splitNumberByStep,
  useWallet,
} from '@/ui/utils';
import { findChainByEnum } from '@/utils/chain';
import clsx from 'clsx';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useAsync } from 'react-use';
import { ConnectedSite } from 'background/service/permission';
import { CHAINS, CHAINS_ENUM } from '@debank/common';

interface Props {
  isCache: boolean;
  balance: number;
}
export const BalanceLabel: React.FC<Props> = ({ isCache, balance }) => {
  const account = useRabbySelector((state) => state.account.currentAccount);
  if (!account) return <></>;
  const splitBalance = splitNumberByStep((balance || 0).toFixed(2)).replace(
    '$',
    ''
  );
  const { hiddenBalance } = useRabbySelector((state) => state.preference);
  const dispatch = useRabbyDispatch();
  const [currentConnect, setCurrentConnect] = useState<
    ConnectedSite | null | undefined
  >(null);
  const handleClick = () => {
    dispatch.preference.setHiddenBalance(!hiddenBalance);
  };
  const [currentConnectedSiteChain, setCurrentConnectedSiteChain] = useState(
    CHAINS_ENUM.ETH
  );
  const wallet = useWallet();

  const currentConnectedSiteChainNativeToken = useMemo(
    () =>
      currentConnectedSiteChain
        ? CHAINS?.[currentConnectedSiteChain]?.nativeTokenAddress || 'eth'
        : 'eth',
    [currentConnectedSiteChain]
  );

  const isETH = currentConnectedSiteChainNativeToken === 'eth';

  useEffect(() => {
    if (currentConnect?.chain) {
      setCurrentConnectedSiteChain(currentConnect?.chain);
    }
  }, [currentConnect?.chain]);

  const { value: tokenLogo, loading: tokenLoading } = useAsync(async () => {
    const chainItem = findChainByEnum(currentConnectedSiteChain, {
      fallback: true,
    })!;

    try {
      const data = await wallet.openapi.getToken(
        account!.address,
        chainItem.serverId || '',
        chainItem.nativeTokenAddress || ''
      );
      return data?.logo_url || chainItem.nativeTokenLogo;
    } catch (error) {
      return chainItem.nativeTokenLogo;
    }
  }, [currentConnectedSiteChain]);

  const getCurrentSite = useCallback(async () => {
    const current = await getCurrentConnectSite(wallet);
    setCurrentConnect(current);
  }, []);

  useEffect(() => {
    getCurrentSite();
  }, []);

  return (
    <div
      className={clsx(
        'cursor-pointer transition-opacity',
        isCache && 'opacity-80'
      )}
      title={splitBalance}
      onClick={handleClick}
    >
      {hiddenBalance ? (
        <span
          className={clsx(
            'font-bold text-[32px] tracking-[16px]',
            'mr-[-16px] ml-4'
          )}
        >
          *****
        </span>
      ) : (
        <div className="flex items-center gap-1">
          <img
            src={tokenLogo}
            className={clsx('rounded-full', {
              'w-[20px] h-[20px]': isETH,
              'w-[1px] h-[1px]': !isETH,
            })}
          />
          <span>{splitBalance}</span>
        </div>
      )}
    </div>
  );
};
