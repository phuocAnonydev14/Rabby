/* eslint "react-hooks/exhaustive-deps": ["error"] */
/* eslint-enable react-hooks/exhaustive-deps */
import React, {
  useState,
  useEffect,
  useCallback,
  useRef,
  useMemo,
} from 'react';
import useCurrentBalance from '@/ui/hooks/useCurrentBalance';
import { useCommonPopupView, useWallet } from 'ui/utils';
import { KEYRING_TYPE } from 'consts';
import { SvgIconOffline } from '@/ui/assets';
import clsx from 'clsx';
import { Button, Skeleton, Typography, message } from 'antd';
import { Chain } from '@debank/common';
import { ChainList } from './ChainList';
import { formChartData, useCurve } from './useCurve';
import { CurvePoint, CurveThumbnail } from './CurveView';
import ArrowNextSVG from '@/ui/assets/dashboard/arrow-next.svg';
import { ReactComponent as UpdateSVG } from '@/ui/assets/dashboard/update.svg';
import { ReactComponent as WarningSVG } from '@/ui/assets/dashboard/warning-1.svg';
import { useDebounce } from 'react-use';
import store, { useRabbyDispatch, useRabbySelector } from '@/ui/store';
import { BalanceLabel } from './BalanceLabel';
import { useTranslation } from 'react-i18next';
import { TooltipWithMagnetArrow } from '@/ui/component/Tooltip/TooltipWithMagnetArrow';
import { findChain } from '@/utils/chain';
import {
  useHomeBalanceView,
  useRefreshHomeBalanceView,
} from './useHomeBalanceView';
import { BALANCE_LOADING_TIMES } from '@/constant/timeout';
import type { Account } from '@/background/service/preference';
import { IExtractFromPromise } from '@/ui/utils/type';
import { log } from 'console';
import { CONLA, entryPointAddr } from '@/utils/const';
import { getKRCategoryByType } from '@/utils/transaction';
import { matomoRequestEvent } from '@/utils/matomo-request';
import { filterRbiSource, useRbiSource } from '@/ui/utils/ga-event';

const BalanceView = ({
  currentAccount,
}: {
  currentAccount?: Account | null;
}) => {
  const { t } = useTranslation();

  const { currentHomeBalanceCache } = useHomeBalanceView(
    currentAccount?.address
  );

  const initHasCacheRef = useRef(!!currentHomeBalanceCache?.balance);
  const [accountBalanceUpdateNonce, setAccountBalanceUpdateNonce] = useState(
    initHasCacheRef?.current ? -1 : 0
  );

  useEffect(() => {
    if (!initHasCacheRef?.current) return;
    const timer = setTimeout(() => {
      setAccountBalanceUpdateNonce((prev) => prev + 1);
    }, BALANCE_LOADING_TIMES.TIMEOUT);

    return () => {
      clearTimeout(timer);
    };
  }, []);
  const { conlaAcc } = useRabbySelector((state) => state.customRPC);

  const {
    balance: latestBalance,
    matteredChainBalances: latestMatteredChainBalances,
    chainBalancesWithValue: latestChainBalancesWithValue,
    success: loadBalanceSuccess,
    balanceLoading,
    balanceFromCache,
    isCurrentBalanceExpired,
    refreshBalance,
    missingList,
  } = useCurrentBalance(currentAccount?.address, {
    update: true,
    noNeedBalance: false,
    nonce: accountBalanceUpdateNonce,
    initBalanceFromLocalCache: !!currentHomeBalanceCache?.balance,
  });

  const {
    curveData: latestCurveData,
    curveChartData: latestCurveChartData,
    refresh: refreshCurve,
    isCurveCollectionExpired,
    isLoading: curveLoading,
  } = useCurve(currentAccount?.address, {
    nonce: accountBalanceUpdateNonce,
    realtimeNetWorth: latestBalance,
    initData: currentHomeBalanceCache?.originalCurveData,
  });
  const wallet = useWallet();
  const [isGnosis, setIsGnosis] = useState(false);
  const [gnosisNetworks, setGnosisNetworks] = useState<Chain[]>([]);
  const [isHover, setHover] = useState(false);
  const [curvePoint, setCurvePoint] = useState<CurvePoint>();
  const [isDebounceHover, setIsDebounceHover] = useState(false);
  const [accountDeployed, setAccountDeployed] = useState('');
  const [isCheckingDeploy, setIsCheckingDeploy] = useState(true);
  const [isDeploying, setIsDeploying] = useState(false);
  const {
    balance,
    curveChartData,
    matteredChainBalances,
    chainBalancesWithValue,
  } = useMemo(() => {
    const balanceValue = latestBalance;

    return {
      balance: balanceValue,
      curveChartData:
        latestCurveChartData ||
        formChartData(
          currentHomeBalanceCache?.originalCurveData || [],
          balanceValue,
          Date.now()
        ),
      matteredChainBalances: latestMatteredChainBalances.length
        ? latestMatteredChainBalances
        : currentHomeBalanceCache?.matteredChainBalances || [],
      chainBalancesWithValue: latestChainBalancesWithValue.length
        ? latestChainBalancesWithValue
        : currentHomeBalanceCache?.chainBalancesWithValue || [],
    };
  }, [
    latestBalance,
    latestMatteredChainBalances,
    latestChainBalancesWithValue,
    latestCurveChartData,
    currentHomeBalanceCache,
  ]);

  const getCacheExpired = useCallback(async () => {
    const res = {
      balanceExpired: await isCurrentBalanceExpired(),
      curveExpired: await isCurveCollectionExpired(),
      expired: false,
    };
    res.expired = res.balanceExpired || res.curveExpired;

    return res;
  }, [isCurrentBalanceExpired, isCurveCollectionExpired]);

  const { isManualRefreshing, onRefresh } = useRefreshHomeBalanceView({
    currentAddress: currentAccount?.address,
    refreshBalance,
    refreshCurve,
    isExpired: getCacheExpired,
  });

  const handleCheckDeployed = async () => {
    try {
      const currentAccountContract = localStorage.getItem(
        `accountContract:${currentAccount?.address}`
      );
      if (currentAccountContract) {
        setAccountDeployed(currentAccountContract);
        setIsCheckingDeploy(false);
        return;
      }
      setIsCheckingDeploy(true);
      const isNotDeployed = await wallet.checkIsDeployedAccountContract();
      console.log({ isNotDeployed });
      store.dispatch.customRPC.setConlaAcc('');
      localStorage.setItem('conlaAccount', '');
      if (!isNotDeployed) {
        const accountContract = await wallet.getAccountContract();
        setAccountDeployed(accountContract?.address || '');
      }
    } catch (e) {
      console.log({ e });
    } finally {
      setIsCheckingDeploy(false);
    }
  };

  useEffect(() => {
    handleCheckDeployed().finally();
  }, [currentAccount]);

  // const refreshTimerlegacy = useRef<NodeJS.Timeout>();
  // only execute once on component mounted or address changed
  useEffect(
    () => {
      (async () => {
        let expirationInfo: IExtractFromPromise<
          ReturnType<typeof getCacheExpired>
        > | null = null;
        if (!currentHomeBalanceCache?.balance) {
          onRefresh({
            balanceExpired: true,
            curveExpired: true,
            isManual: false,
          });
        } else if (
          (expirationInfo = await getCacheExpired()) &&
          expirationInfo.expired
        ) {
          onRefresh({
            balanceExpired: expirationInfo.balanceExpired,
            curveExpired: expirationInfo.curveExpired,
            isManual: false,
          });
        }
      })();

      // const handler = async ({ address }) => {
      //   if (
      //     !currentAccount?.address ||
      //     !isSameAddress(address, currentAccount.address)
      //   )
      //     return;

      //   const count = await dispatch.transactions.getPendingTxCountAsync(
      //     currentAccount.address
      //   );
      //   if (count === 0) {
      //     if (refreshTimerlegacy.current)
      //       clearTimeout(refreshTimerlegacy.current);

      //     refreshTimerlegacy.current = setTimeout(() => {
      //       // increase accountBalanceUpdateNonce to trigger useCurrentBalance re-fetch account balance
      //       // delay 5s for waiting db sync data
      //       setAccountBalanceUpdateNonce((prev) => prev + 1);
      //     }, 5000);
      //   }
      // };
      // eventBus.addEventListener(EVENTS.TX_COMPLETED, handler);

      // return () => {
      //   eventBus.removeEventListener(EVENTS.TX_COMPLETED, handler);
      // };
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [
      // currentHomeBalanceCache?.balance,
      // onRefresh,
      // getCacheExpired
    ]
  );

  const handleIsGnosisChange = useCallback(async () => {
    if (!currentAccount) return;
    const networkIds = await wallet.getGnosisNetworkIds(currentAccount.address);
    const chains = networkIds
      .map((networkId) => {
        return findChain({
          id: Number(networkId),
        });
      })
      .filter((v) => !!v);
    setGnosisNetworks(chains as Chain[]);
  }, [currentAccount, wallet]);

  const handleHoverCurve = (data) => {
    setCurvePoint(data);
  };

  const { activePopup, setData, componentName } = useCommonPopupView();
  const onClickViewAssets = () => {
    activePopup('AssetList');
  };

  useEffect(() => {
    if (componentName === 'AssetList') {
      setData({
        matteredChainBalances: chainBalancesWithValue,
        balance,
        balanceLoading,
        isEmptyAssets: !matteredChainBalances.length,
        isOffline: !loadBalanceSuccess,
      });
    }
  }, [
    chainBalancesWithValue,
    matteredChainBalances.length,
    balance,
    balanceLoading,
    componentName,
    setData,
    loadBalanceSuccess,
  ]);

  useEffect(() => {
    if (currentAccount) {
      setIsGnosis(currentAccount.type === KEYRING_TYPE.GnosisKeyring);
    }
  }, [currentAccount]);

  useEffect(() => {
    if (isGnosis) {
      handleIsGnosisChange();
    }
  }, [isGnosis, handleIsGnosisChange]);

  useEffect(() => {
    if (!isHover) {
      setCurvePoint(undefined);
    }
  }, [isHover]);

  // useEffect(() => {
  //   if (!balanceLoading && !curveLoading) {
  //     setIsManualRefreshing(false);
  //   }
  // }, [balanceLoading, curveLoading]);

  const onMouseMove = () => {
    setHover(true);
  };
  const onMouseLeave = () => {
    setHover(false);
    setIsDebounceHover(false);
  };

  useDebounce(
    () => {
      if (isHover) {
        setIsDebounceHover(true);
      }
    },
    300,
    [isHover]
  );

  const currentHover = isDebounceHover;

  const currentBalance = currentHover ? curvePoint?.value || balance : balance;

  const currentChangePercent = currentHover
    ? curvePoint?.changePercent || curveChartData?.changePercent
    : curveChartData?.changePercent;
  const currentIsLoss =
    currentHover && curvePoint ? curvePoint.isLoss : curveChartData?.isLoss;
  const currentChangeValue = currentHover ? curvePoint?.change : null;
  const { hiddenBalance } = useRabbySelector((state) => state.preference);

  const shouldShowRefreshButton =
    isManualRefreshing || balanceLoading || curveLoading;

  const couldShowLoadingDueToBalanceNil =
    currentBalance === null || (balanceFromCache && currentBalance === 0);
  // const couldShowLoadingDueToUpdateSource = !balanceFromCache || isManualRefreshing;
  const couldShowLoadingDueToUpdateSource =
    !currentHomeBalanceCache?.balance || isManualRefreshing;

  const { conlaLoading } = useRabbySelector((state) => state.customRPC);

  const shouldShowBalanceLoading = balanceLoading || conlaLoading;

  const shouldShowCurveLoading =
    couldShowLoadingDueToBalanceNil ||
    (couldShowLoadingDueToUpdateSource && curveLoading);
  const shouldShowLoading = shouldShowBalanceLoading;
  const shouldHidePercentChange =
    !currentChangePercent ||
    hiddenBalance ||
    shouldShowLoading ||
    !curveChartData?.startUsdValue;

  const shouldRenderCurve =
    !shouldShowLoading && !hiddenBalance && !!curveChartData;

  useEffect(() => {
    (async () => {
      store.dispatch.customRPC.setConlaLoading(true);
      const currentAccountContract = localStorage.getItem('conlaAccount');
      if (currentAccountContract) {
        store.dispatch.customRPC.setConlaAcc(currentAccountContract);
      }
    })();
  }, []);

  const rbisource = useRbiSource();

  const handleDeployContract = async () => {
    try {
      setIsDeploying(true);
      // await wallet.deployAccountContract();
      const data = await wallet.getEncodedDeploy();
      const params = {
        chainId: CONLA.id,
        from: currentAccount?.address || '',
        to: entryPointAddr,
        value: '0x0',
        data,
        isSend: true,
        userTo: '',
        sendValue: '',
        isOwnerMode: false,
        sendToEntryPoint: true,
      };
      matomoRequestEvent({
        category: 'Send',
        action: 'createTx',
        label: [
          CONLA.name,
          getKRCategoryByType(currentAccount?.type),
          currentAccount?.brandName,
          'token',
          filterRbiSource('sendToken', rbisource) && rbisource, // mark source module of `sendToken`
        ].join('|'),
      });

      wallet.sendRequest({
        method: 'eth_sendTransaction',
        params: [params],
        $ctx: {
          ga: {
            category: 'Send',
            source: 'sendToken',
            trigger: filterRbiSource('sendToken', rbisource) && rbisource, // mark source module of `sendToken`
          },
        },
      });
      window.close();
      await handleCheckDeployed();
      await refreshBalance();
      message.success('Deploy successfully');
    } catch (e) {
      console.log(e);
      message.error('Deploy failed');
    } finally {
      setIsDeploying(false);
    }
  };

  return (
    <div onMouseLeave={onMouseLeave} className={clsx('assets flex')}>
      <div className="left relative overflow-x-hidden mx-10">
        <div className={clsx('amount group w-[100%]', 'text-32 mt-6')}>
          <div className={clsx('amount-number leading-[38px]')}>
            {shouldShowBalanceLoading ? (
              <Skeleton.Input active className="w-[200px] h-[38px] rounded" />
            ) : (
              <BalanceLabel
                isCache={balanceFromCache}
                balance={latestBalance || 0}
              />
            )}
          </div>
          <div
            className="flex flex-end items-center gap-[8px] mb-[5px] min-h-[20px]"
            onClick={() => onRefresh({ isManual: true })}
          >
            <div
              className={clsx(
                currentIsLoss ? 'text-[#FF6E6E]' : 'text-[#33CE43]',
                'text-15 font-normal',
                {
                  hidden: shouldHidePercentChange,
                }
              )}
            >
              {currentIsLoss ? '-' : '+'}
              <span>
                {currentChangePercent === '0%' ? '0.00%' : currentChangePercent}
              </span>
              {currentChangeValue ? (
                <span className="ml-4">({currentChangeValue})</span>
              ) : null}
            </div>
            {missingList?.length ? (
              <TooltipWithMagnetArrow
                overlayClassName="rectangle font-normal whitespace-pre-wrap"
                title={t('page.dashboard.home.missingDataTooltip', {
                  text:
                    missingList.join(t('page.dashboard.home.chain')) +
                    t('page.dashboard.home.chainEnd'),
                })}
              >
                <div onClick={(evt) => evt.stopPropagation()}>
                  <WarningSVG />
                </div>
              </TooltipWithMagnetArrow>
            ) : null}
            <div
              className={clsx({
                'block animate-spin': shouldShowRefreshButton,
                hidden: !shouldShowRefreshButton,
                'group-hover:block': !hiddenBalance,
              })}
            >
              <UpdateSVG />
            </div>
          </div>
        </div>
        <div>
          {conlaAcc && accountDeployed && (
            <>
              <span>
                <strong>Account contract: </strong>{' '}
                <Typography.Paragraph
                  style={{ color: '#fff' }}
                  copyable={{ text: accountDeployed }}
                >
                  {accountDeployed}
                </Typography.Paragraph>
              </span>
            </>
          )}
          {!isCheckingDeploy && !accountDeployed && (
            <div className="flex gap-4 items-center">
              <span style={{ color: 'rgba(229,228,228,0.83)' }}>
                Account not deployed
              </span>
              <Button
                loading={isDeploying}
                onClick={handleDeployContract}
                type={'ghost'}
                size={'small'}
                className="text-white"
              >
                Deploy
              </Button>
            </div>
          )}
        </div>
        {/*<div*/}
        {/*  onClick={onClickViewAssets}*/}
        {/*  onMouseMove={onMouseMove}*/}
        {/*  onMouseLeave={onMouseLeave}*/}
        {/*  className={clsx(*/}
        {/*    'mt-[4px] mb-10',*/}
        {/*    currentHover && 'bg-[#000] bg-opacity-10',*/}
        {/*    'rounded-[4px] relative cursor-pointer',*/}
        {/*    'overflow-hidden'*/}
        {/*  )}*/}
        {/*>*/}
        {/*  <img*/}
        {/*    src={ArrowNextSVG}*/}
        {/*    className={clsx(*/}
        {/*      'absolute w-[20px] h-[20px] top-[8px] right-[10px]',*/}
        {/*      !currentHover && 'opacity-80'*/}
        {/*      // balanceFromCache*/}
        {/*      //   ? !currentHover && 'opacity-0'*/}
        {/*      //   : !currentHover && 'opacity-80'*/}
        {/*    )}*/}
        {/*  />*/}
        {/*  <div*/}
        {/*    className={clsx(*/}
        {/*      'extra flex h-[28px]',*/}
        {/*      'mx-[10px] pt-[8px] mb-[8px]'*/}
        {/*    )}*/}
        {/*  >*/}
        {/*    {shouldShowLoading ? (*/}
        {/*      <>*/}
        {/*        <Skeleton.Input active className="w-[130px] h-[20px] rounded" />*/}
        {/*      </>*/}
        {/*    ) : !loadBalanceSuccess ? (*/}
        {/*      <>*/}
        {/*        <SvgIconOffline className="mr-4 text-white" />*/}
        {/*        <span className="leading-tight">*/}
        {/*          {t('page.dashboard.home.offline')}*/}
        {/*        </span>*/}
        {/*      </>*/}
        {/*    ) : chainBalancesWithValue.length > 0 ? (*/}
        {/*      <div*/}
        {/*        className={clsx(*/}
        {/*          'flex space-x-4',*/}
        {/*          !currentHover && 'opacity-80'*/}
        {/*        )}*/}
        {/*      >*/}
        {/*        <ChainList*/}
        {/*          isGnosis={isGnosis}*/}
        {/*          matteredChainBalances={chainBalancesWithValue.slice(0)}*/}
        {/*          gnosisNetworks={gnosisNetworks}*/}
        {/*        />*/}
        {/*      </div>*/}
        {/*    ) : (*/}
        {/*      <span*/}
        {/*        className={clsx(*/}
        {/*          'text-14 text-r-neutral-title-2',*/}
        {/*          !currentHover && 'opacity-70'*/}
        {/*        )}*/}
        {/*      >*/}
        {/*        {t('page.dashboard.assets.noAssets')}*/}
        {/*      </span>*/}
        {/*    )}*/}
        {/*  </div>*/}
        {/*  /!*<div className={clsx('h-[80px] w-full relative')}>*!/*/}
        {/*  /!*  {!!shouldRenderCurve && !!curveChartData && (*!/*/}
        {/*  /!*    <CurveThumbnail*!/*/}
        {/*  /!*      isHover={currentHover}*!/*/}
        {/*  /!*      data={curveChartData}*!/*/}
        {/*  /!*      onHover={handleHoverCurve}*!/*/}
        {/*  /!*    />*!/*/}
        {/*  /!*  )}*!/*/}
        {/*  /!*  {!!shouldShowLoading && (*!/*/}
        {/*  /!*    <div className="flex mt-[14px]">*!/*/}
        {/*  /!*      <Skeleton.Input*!/*/}
        {/*  /!*        active*!/*/}
        {/*  /!*        className="m-auto w-[360px] h-[72px] rounded"*!/*/}
        {/*  /!*      />*!/*/}
        {/*  /!*    </div>*!/*/}
        {/*  /!*  )}*!/*/}
        {/*  /!*</div>*!/*/}
        {/*</div>*/}
      </div>
    </div>
  );
};

export default BalanceView;
