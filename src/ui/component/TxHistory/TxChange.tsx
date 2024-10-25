import { ConlaTxHistoryItem, TokenItem } from '@/background/service/openapi';
import NFTAvatar from '@/ui/views/Dashboard/components/NFT/NFTAvatar';
import React from 'react';
import IconUnknown from 'ui/assets/token-default.svg';
import { numberWithCommasIsLtOne } from 'ui/utils';
import { getTokenSymbol } from 'ui/utils/token';
import { TokenLabel } from './TokenLabel';
import { useTranslation } from 'react-i18next';
import { TxStatus } from '@/ui/views/History/components/HistoryItem';

type TokenChangeProps = {
  data: ConlaTxHistoryItem;
  canClickToken?: boolean;
  onClose?: () => void;
  token: TokenItem;
  txStatus: TxStatus;
};

export const TokenChange = ({
  data: info,
  token,
  canClickToken = true,
  onClose,
  txStatus,
}: TokenChangeProps) => {
  const { t } = useTranslation();

  const isNft = token.id.length === 32;
  const symbol = getTokenSymbol(token);
  const name = isNft
    ? token?.name ||
      (symbol ? `${symbol} ${token?.inner_id}` : t('global.unknownNFT'))
    : symbol;

  return (
    <div className="ui token-change">
      {/* {info.sends?.map((v) => { */}(
      <div
        className="token-change-item"
        title={name}
        data-id={token.id}
        data-name={name}
        key={token.id}
      >
        {isNft ? (
          <NFTAvatar
            className="token-icon"
            thumbnail
            content={token?.content}
            type={token?.content_type}
          ></NFTAvatar>
        ) : (
          <img
            className="token-icon"
            src={token?.logo_url || IconUnknown}
            alt=""
          />
        )}
        <span
          style={{
            width: 8,
            display: 'inline-block',
            textAlign: 'center',
          }}
        >
          -
        </span>
        <span className="token-change-item-text">
          {isNft ? token.amount : numberWithCommasIsLtOne(token.amount, 2)}
        </span>
        <TokenLabel
          isNft={isNft}
          token={token}
          canClickToken={isNft ? false : canClickToken}
          onClose={onClose}
        />
      </div>
      );
      {/* })} */}
      {/* {info.receives?.map((v) => { */}
      return (
      <div
        data-id={token.id}
        data-name={name}
        className="token-change-item is-success"
        title={name}
        key={token.id}
      >
        {isNft ? (
          <NFTAvatar
            className="token-icon"
            thumbnail
            content={token?.content}
            type={token?.content_type}
          ></NFTAvatar>
        ) : (
          <img
            className="token-icon"
            src={token?.logo_url || IconUnknown}
            alt=""
          />
        )}
        <span
          style={{
            width: 8,
            display: 'inline-block',
            textAlign: 'center',
          }}
        >
          +
        </span>
        <span className="token-change-item-text">
          {isNft ? token.amount : numberWithCommasIsLtOne(token.amount, 2)}
        </span>
        <TokenLabel
          isNft={isNft}
          token={token}
          canClickToken={canClickToken}
          onClose={onClose}
        />
      </div>
      );
      {/* })} */}
    </div>
  );
};
