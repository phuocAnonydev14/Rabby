import { useRequest } from 'ahooks';
import { TestnetChainBase } from 'background/service/customTestnet';
import { useWallet } from 'ui/utils';
import { useEffect } from 'react';
import React from 'react';
import { CONLA } from '@/utils/const';
import browser from 'webextension-polyfill';

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

  const checkUserRedirectOauth = async () => {
    const users = await browser.storage.local.get('user_oauth_google');
    if (users?.user_oauth_google) {
      console.log('users', users);
    }
  };

  useEffect(() => {
    (async () => {
      try {
        await runAddTestnet(CONLA, {
          ga: {
            source: 'tokenList',
          },
        });
        checkUserRedirectOauth();
      } catch (e) {
        console.log({ e });
      }
    })();
  }, []);

  return <></>;
};
