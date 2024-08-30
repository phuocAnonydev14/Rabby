import { TxDisplayItem, TxHistoryItem } from '@/background/service/openapi';
import React from 'react';
import { NameAndAddress } from '..';
import { getTokenSymbol } from 'ui/utils/token';
import { TxAvatar } from './TxAvatar';
import { useTranslation } from 'react-i18next';

type TxInterAddressExplainProps = {
  data: TxDisplayItem | TxHistoryItem;
};

export const TxInterAddressExplain = ({ data }: TxInterAddressExplainProps) => {
  const isCancel = data.cate_id === 'cancel';
  const isApprove = data.cate_id === 'approve';
  const { t } = useTranslation();

  // if (isCancel) {
  //   interAddressExplain = t('page.transactions.explain.cancel');
  // } else if (isApprove) {
  //   const tokenId = data.token_approve?.token_id || '';
  //   const tokenUUID = `${data.chain}_token:${tokenId}`;

  //   const approveToken = tokenDict[tokenId] || tokenDict[tokenUUID];

  //   const amount = data.token_approve?.value || 0;

  //   // todo: translate
  //   interAddressExplain = (
  //     <div className="tx-explain-title">
  //       Approve {amount < 1e9 ? amount.toFixed(4) : 'infinite'}{' '}
  //       {`${getTokenSymbol(approveToken)} for `}
  //       {projectName}
  //     </div>
  //   );
  // } else {
  const interAddressExplain = (
    <>
      <div className="tx-explain-title">
        {/* {cateDict[data.cate_id || '']?.name ??
          (data.tx?.name || t('page.transactions.explain.unknown'))} */}
        Send
      </div>
      <div className="tx-explain-desc">
        <NameAndAddress address={data.other_addr} copyIcon={!data.is_scam} />
      </div>
    </>
  );
  // }

  return (
    <div className="ui tx-explain">
      <TxAvatar
        src={
          'https://img.freepik.com/free-psd/3d-illustration-person-with-sunglasses_23-2149436188.jpg?size=626&ext=jpg&ga=GA1.1.1566160876.1724917417&semt=ais_hybrid'
        }
        cateId={data.cate_id}
        className="tx-icon"
      ></TxAvatar>
      <div className="tx-explain-body">{interAddressExplain}</div>
    </div>
  );
};
