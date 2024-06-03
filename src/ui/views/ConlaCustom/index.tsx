import { useRequest } from 'ahooks';
import { TestnetChainBase } from 'background/service/customTestnet';
import { useWallet } from 'ui/utils';
import { useEffect } from 'react';
import React from 'react';
import { CONLA } from '@/utils/const';

export const ConlaCustom = () => {
  const wallet = useWallet();

  const { runAsync: runAddTestnet } = useRequest(
    (
      data: TestnetChainBase,
      ctx?: {
        ga?: {
          source?: string;
        };
      }
    ) => {
      return wallet.addCustomTestnet(data, ctx);
    },
    {
      manual: true,
    }
  );

  useEffect(() => {
    (async () => {
      try {
        const res = await runAddTestnet(CONLA, {
          ga: {
            source: 'tokenList',
          },
        });
        console.log({ res });
      } catch (e) {
        console.log({ e });
      }
    })();
  }, []);

  return <></>;
};
