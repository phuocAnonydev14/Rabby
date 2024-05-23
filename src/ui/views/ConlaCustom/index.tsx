import { useRequest } from 'ahooks';
import { TestnetChainBase } from 'background/service/customTestnet';
import { useWallet } from 'ui/utils';
import { useEffect } from 'react';
import React from 'react';

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
    console.log('come to add');
    (async () => {
      try {
        const res = await runAddTestnet(
          {
            id: 1337,
            name: 'Conla',
            rpcUrl: 'http://localhost:8545',
            nativeTokenSymbol: 'CONLA',
          },
          {
            ga: {
              source: 'tokenList',
            },
          }
        );
        console.log({ res });
      } catch (e) {
        console.log({ e });
      }
    })();
  }, []);

  return <></>;
};
