import { last } from 'lodash';
import React, { useRef } from 'react';
import { Trans, useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';

import { useAccount } from '@/ui/store-hooks';
import { useInfiniteScroll } from 'ahooks';
import { Virtuoso } from 'react-virtuoso';
import { Empty, Modal } from 'ui/component';
import { useWallet } from 'ui/utils';
import { HistoryItem, HistoryItemActionContext } from './HistoryItem';
import { Loading } from './Loading';
import { CONLA } from '@/utils/const';
import {
  ConlaTxHistoryItem,
  TokenItem,
  TxHistoryItem,
} from '@rabby-wallet/rabby-api/dist/types';

const PAGE_COUNT = 10;

const mockTxs: TxHistoryItem[] = [
  {
    cate_id: null,
    chain: CONLA.id.toString(),
    debt_liquidated: null,
    id: '0xjasdhhh2j312jkh32131231',
    is_scam: false,
    other_addr: '0xOtherAddress1',
    project_id: null,
    receives: [
      {
        amount: 50,
        from_addr: '0xAddress1',
        token_id: '',
      },
    ],
    sends: [],
    time_at: 1693500000000,
    token_approve: {
      spender: '0xSpender1',
      token_id: 'ETH',
      value: 100,
    },
    tx: {
      eth_gas_fee: 0.01,
      from_addr: '0xAddress1',
      name: 'Transfer',
      params: ['param1', 'param2'],
      status: 1,
      to_addr: '0xAddress2',
      usd_gas_fee: 0.5,
      value: 50,
      message: null,
    },
  },
  {
    cate_id: 'category2',
    chain: 'Binance Smart Chain',
    debt_liquidated: null,
    id: 'tx2',
    is_scam: true,
    other_addr: '0xOtherAddress2',
    project_id: 'project1',
    receives: [],
    sends: [
      {
        amount: 50,
        to_addr: '0xAddress4',
        token_id: 'BNB',
      },
    ],
    time_at: 1693600000000,
    token_approve: null,
    tx: {
      eth_gas_fee: 0.02,
      from_addr: '0xAddress3',
      name: 'Approval',
      params: ['param1'],
      status: 0,
      to_addr: '0xAddress4',
      usd_gas_fee: 1.0,
      value: 100,
      message: 'Failed transaction',
    },
  },
  {
    cate_id: 'category3',
    chain: 'Polygon',
    debt_liquidated: null,
    id: 'tx3',
    is_scam: false,
    other_addr: '0xOtherAddress3',
    project_id: null,
    receives: [],
    sends: [
      {
        amount: 150,
        to_addr: '0xAddress6',
        token_id: 'MATIC',
      },
    ],
    time_at: 1693700000000,
    token_approve: {
      spender: '0xSpender2',
      token_id: 'MATIC',
      value: 300,
    },
    tx: {
      eth_gas_fee: 0.005,
      from_addr: '0xAddress5',
      name: 'Transfer',
      params: ['param1', 'param2', 'param3'],
      status: 1,
      to_addr: '0xAddress6',
      usd_gas_fee: 0.25,
      value: 200,
      message: 'Transaction successful',
    },
  },
  {
    cate_id: null,
    chain: 'Avalanche',
    debt_liquidated: null,
    id: 'tx4',
    is_scam: false,
    other_addr: '0xOtherAddress4',
    project_id: 'project2',
    receives: [],
    sends: [
      {
        amount: 200,
        to_addr: '0xAddress8',
        token_id: 'AVAX',
      },
    ],
    time_at: 1693800000000,
    token_approve: {
      spender: '0xSpender3',
      token_id: 'AVAX',
      value: 400,
    },
    tx: {
      eth_gas_fee: 0.015,
      from_addr: '0xAddress7',
      name: 'Transfer',
      params: ['param1', 'param2'],
      status: 1,
      to_addr: '0xAddress8',
      usd_gas_fee: 0.75,
      value: 300,
      message: 'Transaction processed',
    },
  },
  {
    cate_id: 'category5',
    chain: 'Solana',
    debt_liquidated: null,
    id: 'tx5',
    is_scam: true,
    other_addr: '0xOtherAddress5',
    project_id: 'project3',
    receives: [
      {
        amount: 500,
        from_addr: '0xAddress9',
        token_id: 'SOL',
      },
    ],
    sends: [
      {
        amount: 450,
        to_addr: '0xAddress10',
        token_id: 'SOL',
      },
    ],
    time_at: 1693900000000,
    token_approve: null,
    tx: {
      eth_gas_fee: 0.01,
      from_addr: '0xAddress9',
      name: 'Transfer',
      params: [],
      status: 0,
      to_addr: '0xAddress10',
      usd_gas_fee: 0.5,
      value: 500,
      message: 'Scam detected',
    },
  },
];

export const conlaHisToryList: ConlaTxHistoryItem[] = [
  {
    hash: '0x1a546f8e8df87d2c91e9795b86d6fe2c61f338cd053c665ea977ad758103fa2a',
    value: '50000000000000000',
    gas: 0,
    gasPrice: 0,
    nonce: 0,
    data: '',
    from: '0xc635e930d2af544eebc7421f3c20563505ca065e',
    to: '0x2a92533f2ffbe783fd484cd58a52d24531b2e4ed',
    timestamp: '2024-08-27T17:10:27.204114+07:00',
    blockNumber: 0,
    createdAt: '0001-01-01T00:00:00Z',
    updatedAt: '0001-01-01T00:00:00Z',
  },
];

export const HistoryList = ({
  isFilterScam = false,
}: {
  isFilterScam?: boolean;
}) => {
  const wallet = useWallet();
  const { t } = useTranslation();

  const ref = useRef<HTMLDivElement | null>(null);
  const [account] = useAccount();

  const getAllTxHistory = (
    params: Parameters<typeof wallet.openapi.getAllTxHistory>[0]
  ) => {
    const getHistory = wallet.openapi.getAllTxHistory;

    return getHistory(params).then((res) => {
      if (res.history_list) {
        res.history_list = res.history_list.filter((item) => {
          return !item.is_scam;
        });
      }
      return res;
    });
  };

  const fetchData = async (startTime = 0) => {
    const { address } = account!;
    const apiLevel = await wallet.getAPIConfig([], 'ApiLevel', false);
    if (apiLevel >= 1) {
      return {
        list: [],
      };
    }
    const getHistory = wallet.openapi.listTxHisotry;

    const res = isFilterScam
      ? await getAllTxHistory({
          id: address,
        })
      : await getHistory({
          id: address,
          start_time: startTime,
          page_count: PAGE_COUNT,
        });

    const { project_dict, cate_dict, history_list: list } = res;
    const displayList = list
      .map((item) => ({
        ...item,
        projectDict: project_dict,
        cateDict: cate_dict,
        tokenDict: 'token_dict' in res ? res.token_dict : undefined,
        tokenUUIDDict:
          'token_uuid_dict' in res ? res.token_uuid_dict : undefined,
      }))
      .sort((v1, v2) => v2.time_at - v1.time_at);
    return {
      last: last(displayList)?.time_at,
      list: displayList,
    };
  };

  const { data, loading, loadingMore, loadMore } = useInfiniteScroll(
    (d) => fetchData(d?.last),
    {
      isNoMore: (d) => {
        return isFilterScam
          ? true
          : !d?.last || (d?.list.length || 0) < PAGE_COUNT;
      },
    }
  );

  const isEmpty = (data?.list?.length || 0) <= 0 && !loading;

  const [
    focusingHistoryItem,
    setFocusingHistoryItem,
  ] = React.useState<HistoryItemActionContext | null>(null);

  return (
    <div className="overflow-auto h-full" ref={ref}>
      <Modal
        visible={!!focusingHistoryItem}
        // View Message
        title={t('page.transactions.modalViewMessage.title')}
        className="view-tx-message-modal"
        onCancel={() => {
          setFocusingHistoryItem(null);
        }}
        maxHeight="360px"
      >
        <div className="parsed-content text-14">
          {focusingHistoryItem?.parsedInputData}
        </div>
      </Modal>

      {loading ? (
        <div className={isFilterScam ? 'pt-[20px]' : ''}>
          {isFilterScam ? (
            <div className="filter-scam-loading-text">
              {t('page.transactions.filterScam.loading')}
            </div>
          ) : null}
          <Loading count={4} active />
        </div>
      ) : (
        <>
          {/* {isEmpty ? (
            <Empty
              title={t('page.transactions.empty.title')}
              desc={
                <span>
                  <Trans i18nKey="page.transactions.empty.desc" t={t}>
                    No transactions found on
                    <Link className="underline" to="/settings/chain-list">
                      supported chains
                    </Link>
                  </Trans>
                </span>
              }
              className="pt-[108px]"
            ></Empty>
          ) : ( */}
          <Virtuoso
            style={{
              height: '100%',
            }}
            data={conlaHisToryList}
            itemContent={(_, item) => {
              return (
                <HistoryItem
                  data={item}
                  // projectDict={item.projectDict}
                  // cateDict={item.cateDict}
                  // tokenDict={item.tokenDict || item.tokenUUIDDict || {}}
                  key={item.hash}
                  onViewInputData={setFocusingHistoryItem}
                />
              );
            }}
            endReached={loadMore}
            components={{
              Footer: () => {
                if (loadingMore) {
                  return <Loading count={4} active />;
                }
                return null;
              },
            }}
          ></Virtuoso>
          {/* )} */}
        </>
      )}
    </div>
  );
};
