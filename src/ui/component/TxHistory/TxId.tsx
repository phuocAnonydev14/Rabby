import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { openInTab } from 'ui/utils/webapi';
import { getChain, getTxScanLink } from '@/utils';
import { useWallet } from '@/ui/utils';
import { P } from 'ts-toolbelt/out/Object/_api';
import { Chain } from '@/types/chain';
import { CONLA } from '@/utils/const';

interface TxIdProps {
  id: string;
  chain: string;
}

const ellipsis = (text: string) => {
  return text.replace(/^(.{6})(.*)(.{4})$/, '$1...$3');
};

export const TxId = React.memo(({ chain, id }: TxIdProps) => {
  const info = useMemo(() => getChain(chain), [chain]);

  const handleScanClick = useCallback(() => {
    const link = getTxScanLink(CONLA.scanLink || '', id);
    openInTab(link);
  }, []);
  return (
    <div className="ui tx-id-container">
      {/* <span className="tx-id-chain">{info?.name || 'Unknown'}</span> */}
      <a className="tx-id" onClick={handleScanClick}>
        {ellipsis(id)}
      </a>
    </div>
  );
});
