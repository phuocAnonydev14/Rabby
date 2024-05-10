import { useEffect, useRef, useState, useCallback } from 'react';
import { useWallet } from '../utils/WalletContext';
import { TokenItem } from '@rabby-wallet/rabby-api/dist/types';
import { DisplayedToken } from '../utils/portfolio/project';
import { AbstractPortfolioToken } from '../utils/portfolio/types';
import { useRabbySelector } from 'ui/store';
import { isSameAddress } from '../utils';
import { requestOpenApiWithChainId } from '../utils/openapi';
import { findChainByServerID } from '@/utils/chain';
import { BigNumber, ethers } from 'ethers';
import { CONCHA_RPC } from '@/background/utils/conts';
import { ERC20ABI } from '@/constant/abi';

const useSearchToken = (
  address: string | undefined,
  kw: string,
  chainServerId?: string,
  withBalance = false,
  isTestnet = false
) => {
  const wallet = useWallet();
  const [result, setResult] = useState<AbstractPortfolioToken[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const addressRef = useRef(address);
  const kwRef = useRef('');
  const { customize, blocked } = useRabbySelector(
    (state) => state.account.tokens
  );

  const searchToken = useCallback(
    async ({
      address,
      q,
      chainId,
    }: {
      address: string;
      q: string;
      chainId?: string;
    }) => {
      const list: TokenItem[] = [];
      setIsLoading(true);
      const chainItem = !chainId ? null : findChainByServerID(chainId);

      if (q.length === 42 && q.toLowerCase().startsWith('0x')) {
        // list = await requestOpenApiWithChainId(
        //   (ctx) => ctx.openapi.searchToken(address, q, chainId, true),
        //   {
        //     isTestnet: isTestnet !== false || chainItem?.isTestnet,
        //     wallet,
        //   }
        // );

        const provider = new ethers.providers.JsonRpcProvider(CONCHA_RPC);
        const tokenFiltered = new ethers.Contract(q, ERC20ABI, provider);
        const symbol = await tokenFiltered.symbol();
        const name = await tokenFiltered.name();
        const balance = await tokenFiltered.balanceOf(address);
        const decimals = await tokenFiltered.decimals();

        list.push({
          amount: +balance / 10 ** decimals,
          symbol,
          name,
          chain: 'eth',
          decimals,
          display_symbol: null,
          id: q,
          is_core: false,
          is_verified: true,
          is_wallet: true,
          logo_url: '',
          optimized_symbol: '',
          price: 23,
          time_at: 0,
        });
        alert(symbol + ' ' + name + '' + balance + '' + decimals);
      } else {
        let isExistedSearchEth = false;
        ['e', 't', 'h'].forEach((key) => {
          if (q.includes(key)) isExistedSearchEth = true;
        });
        if (isExistedSearchEth) {
          const conChaToken = await wallet.getCurrentToken(undefined, address);
          if (conChaToken) {
            list.push(conChaToken);
          }
        }
        // list = await requestOpenApiWithChainId(
        //   (ctx) => ctx.openapi.searchToken(address, q, chainId),
        //   {
        //     isTestnet: isTestnet !== false || chainItem?.isTestnet,
        //     wallet,
        //   }
        // );
        // if (withBalance) {
        //   list = list.filter((item) => item.amount > 0);
        // }
      }

      const reg = new RegExp(q, 'i');
      const matchCustomTokens = customize.filter((token) => {
        return (
          reg.test(token.name) ||
          reg.test(token.symbol) ||
          reg.test(token.display_symbol || '')
        );
      });
      if (addressRef.current === address && kwRef.current === q) {
        setIsLoading(false);
        setResult(
          [
            ...(list.map(
              (item) => new DisplayedToken(item)
            ) as AbstractPortfolioToken[]),
            ...matchCustomTokens,
          ].filter((item) => {
            const isBlocked = !!blocked.find((b) =>
              isSameAddress(b.id, item.id)
            );
            return !isBlocked;
          })
        );
      }
    },
    [customize, blocked, isTestnet]
  );

  useEffect(() => {
    addressRef.current = address;
  }, [address]);

  useEffect(() => {
    kwRef.current = kw;
  }, [kw]);

  useEffect(() => {
    if (!address || !kw) {
      setIsLoading(false);
      return;
    }
    searchToken({
      address,
      q: kw,
      chainId: chainServerId,
    });
  }, [kw, address, chainServerId]);

  return {
    list: result,
    isLoading,
  };
};

export default useSearchToken;
