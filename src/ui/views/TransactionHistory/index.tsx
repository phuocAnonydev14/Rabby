import { Account } from '@/background/service/preference';
import { EVENTS } from '@/constant';
import eventBus from '@/eventBus';
import { useAccount } from '@/ui/store-hooks';
import { findChainByID } from '@/utils/chain';
import { useMemoizedFn } from 'ahooks';
import { TransactionGroup } from 'background/service/transactionHistory';
import minBy from 'lodash/minBy';
import React, { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Empty } from 'ui/component';
import { isSameAddress, useWallet } from 'ui/utils';
import { SkipNonceAlert } from './components/SkipNonceAlert';
import { TransactionItem } from './components/TransactionItem';
import { useLoadTxRequests } from './hooks';
import './style.less';

const transactionGroups: TransactionGroup[] = [
  {
    chainId: 1,
    nonce: 1,
    txs: [
      {
        rawTx: {
          chainId: 1,
          data: '0xabcdef',
          from: '0xAddress1',
          nonce: '1',
          to: '0xAddress2',
          value: '100',
        },
        createdAt: 1693500000000,
        isCompleted: true,
        failed: false,
      },
    ],
    isPending: false,
    createdAt: 1693500000000,
    isFailed: false,
  },
  {
    chainId: 2,
    nonce: 2,
    txs: [
      {
        rawTx: {
          chainId: 2,
          data: '0xabcdef',
          from: '0xAddress3',
          nonce: '2',
          to: '0xAddress4',
          value: '200',
        },
        createdAt: 1693600000000,
        isCompleted: false,
        failed: false,
      },
    ],
    isPending: true,
    createdAt: 1693600000000,
    isFailed: false,
  },
  {
    chainId: 3,
    nonce: 3,
    txs: [
      {
        rawTx: {
          chainId: 3,
          data: '0xabcdef',
          from: '0xAddress5',
          nonce: '3',
          to: '0xAddress6',
          value: '300',
        },
        createdAt: 1693700000000,
        isCompleted: true,
        failed: true,
      },
    ],
    isPending: false,
    createdAt: 1693700000000,
    isFailed: true,
  },
  {
    chainId: 4,
    nonce: 4,
    txs: [
      {
        rawTx: {
          chainId: 4,
          data: '0xabcdef',
          from: '0xAddress7',
          nonce: '4',
          to: '0xAddress8',
          value: '400',
        },
        createdAt: 1693800000000,
        isCompleted: true,
        failed: false,
      },
    ],
    isPending: false,
    createdAt: 1693800000000,
    isFailed: false,
  },
  {
    chainId: 5,
    nonce: 5,
    txs: [
      {
        rawTx: {
          chainId: 5,
          data: '0xabcdef',
          from: '0xAddress9',
          nonce: '5',
          to: '0xAddress10',
          value: '500',
        },
        createdAt: 1693900000000,
        isCompleted: false,
        failed: false,
      },
    ],
    isPending: true,
    createdAt: 1693900000000,
    isFailed: false,
  },
];

const TransactionHistory = () => {
  const wallet = useWallet();
  const { t } = useTranslation();
  const [account] = useAccount();
  const [_pendingList, setPendingList] = useState<TransactionGroup[]>([]);
  const [_completeList, setCompleteList] = useState<TransactionGroup[]>([]);

  const pendingList = useMemo(() => {
    return _pendingList.filter((item) => findChainByID(item?.chainId));
  }, [_pendingList]);

  const completeList = useMemo(() => {
    return _completeList.filter((item) => findChainByID(item?.chainId));
  }, [_completeList]);

  const init = async () => {
    const account = await wallet.syncGetCurrentAccount<Account>()!;
    const { pendings, completeds } = await wallet.getTransactionHistory(
      account.address
    );
    setPendingList(pendings);
    setCompleteList(completeds);
  };

  const loadPendingListQueue = async () => {
    const account = await wallet.syncGetCurrentAccount<Account>()!;
    await wallet.loadPendingListQueue(account.address);
  };

  const handleTxComplete = () => {
    init();
    loadPendingListQueue();
  };

  useEffect(() => {
    init();
    loadPendingListQueue();
  }, []);

  const { txRequests, reloadTxRequests } = useLoadTxRequests(pendingList);

  const handleReload = useMemoizedFn((params: { addressList: string[] }) => {
    if (
      account?.address &&
      params?.addressList?.find((item) => {
        return isSameAddress(item || '', account?.address || '');
      })
    ) {
      init();
      reloadTxRequests();
    }
  });

  useEffect(() => {
    eventBus.addEventListener(EVENTS.RELOAD_TX, handleReload);
    return () => {
      eventBus.removeEventListener(EVENTS.RELOAD_TX, handleReload);
    };
  }, [handleReload]);

  return (
    <div className="tx-history">
      <SkipNonceAlert pendings={pendingList} />
      {/* {pendingList.length > 0 && ( */}
      <div className="tx-history__pending">
        {transactionGroups.map((item) => (
          <TransactionItem
            item={item}
            key={`${item.chainId}-${item.nonce}`}
            canCancel={
              minBy(
                pendingList.filter((i) => i.chainId === item.chainId),
                (i) => i.nonce
              )?.nonce === item.nonce
            }
            onComplete={() => handleTxComplete()}
            txRequests={txRequests}
            // onQuickCancel={init}
          />
        ))}
      </div>
      {/* )} */}
      {completeList.length > 0 && (
        <div className="tx-history__completed">
          {completeList.map((item) => (
            <TransactionItem
              txRequests={txRequests}
              item={item}
              key={`${item.chainId}-${item.nonce}`}
              canCancel={false}
            />
          ))}
        </div>
      )}
      {/* {completeList.length <= 0 && pendingList.length <= 0 && (
        <Empty
          title={t('page.activities.signedTx.empty.title')}
          desc={t('page.activities.signedTx.empty.desc')}
          className="pt-[108px]"
        ></Empty>
      )} */}
    </div>
  );
};

export default TransactionHistory;
