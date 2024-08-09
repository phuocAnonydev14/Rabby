import { useRequest } from 'ahooks';
import { TestnetChainBase } from 'background/service/customTestnet';
import { useWallet, useWalletRequest } from 'ui/utils';
import { useEffect, useState } from 'react';
import React from 'react';
import { CONLA } from '@/utils/const';
import browser from 'webextension-polyfill';
import { UserOauth } from '@/types/conla-oauth';
import { Button, Input, message, Modal, Radio, RadioChangeEvent } from 'antd';
import { AppSocial } from 'aa-conla-social-sdk';
import { KEYRING_TYPE } from '@/constant';
import { useHistory } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { AddressViewer } from '@/ui/component';
import Wallet from 'ethereumjs-wallet';
import { ethers } from 'ethers';
export function deriveEthAddressFromKey(privateKey: string): string {
  const wallet = Wallet.fromPrivateKey(Buffer.from(privateKey, 'hex'));
  return '0x' + wallet.getAddress().toString('hex');
}

export const ConlaCustom = () => {
  const wallet = useWallet();
  const history = useHistory();
  const { t } = useTranslation();

  const [isLoading, setIsLoading] = useState(false);
  const [selectedPrivateKey, setSelectedPrivateKey] = useState('');
  const [privateKeys, setPrivateKeys] = useState<string[]>([]);
  const [privateKeyImported, setPrivateKeyImported] = useState<string>('');

  const onChange = (e: RadioChangeEvent) => {
    console.log('radio checked', e.target.value);
    setSelectedPrivateKey(e.target.value);
  };

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

  const [run, loading] = useWalletRequest(wallet.importPrivateKey, {
    async onSuccess(accounts) {
      const importedAccounts = await wallet.getTypedAccounts(
        KEYRING_TYPE.SimpleKeyring
      );
      const successShowAccounts = accounts.map((item, index) => {
        return { ...item, index: index + 1 };
      });
      history.replace({
        pathname: '/popup/import/success',
        state: {
          accounts: successShowAccounts,
          title: t('page.newAddress.importedSuccessfully'),
          editing: true,
          importedAccount: true,
          importedLength: importedAccounts.length,
        },
      });
    },
    onError(err) {
      message.error(
        err?.message || t('page.newAddress.privateKey.notAValidPrivateKey')
      );
    },
  });

  const handleGeneratePrivateKey = async (
    userOauth: UserOauth,
    appSocial: AppSocial
  ) => {
    try {
      setIsLoading(true);
      const privateKey = await appSocial.user?.generatePrivateKey(
        userOauth.idToken
      );
      await run(privateKey);
      message.success('Generate successfully');
    } catch (e: any) {
      console.log(e);
      message.error(e.message || 'Server error');
    } finally {
      setIsLoading(false);
    }
  };

  const checkUserRedirectOauth = async () => {
    const users = await browser.storage.local.get('user_oauth_google');
    browser.storage.local.remove('user_oauth_google');
    if (users?.user_oauth_google) {
      const userOauth: UserOauth = JSON.parse(users.user_oauth_google);
      console.log('users', userOauth);

      const appSocial = new AppSocial(
        'http://localhost:3000/oauth',
        'http://localhost:3000'
      );

      const {
        email,
        id,
        encryptionKey,
        created_at,
        updatedAt,
      } = userOauth.user;

      const user = appSocial.user?.setInformation(
        email,
        id,
        encryptionKey,
        created_at,
        updatedAt
      );

      if (!userOauth.user.encryptionKey) {
        return Modal.confirm({
          title: "You account didn't have private key",
          content: 'You will get one key for your account, generate now',
          onOk: async () => {
            handleGeneratePrivateKey(userOauth, appSocial);
          },
          okButtonProps: {
            loading: isLoading,
          },
          okText: 'Generate',
        });
      }

      const privateKey = await appSocial.user?.getPrivateKey(userOauth.idToken);
      setPrivateKeys([privateKey as string]);
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

  return (
    <>
      <Modal
        onCancel={() => {
          setPrivateKeys([]);
        }}
        footer={null}
        visible={!!privateKeys.length}
        title="Select private key"
      >
        <div className="px-8 overflow-hidden w-full">
          <Radio.Group className="options w-full" onChange={onChange}>
            {privateKeys.length > 0 &&
              privateKeys.map((key) => {
                return (
                  <div className="option p-4 w-full" key={key}>
                    <Radio value={key}>
                      <div className="flex flex-row gap-4 items-center">
                        <div
                          className="text-15 ml-6 mr-6 dashboard-name"
                          title={'Private key'}
                        >
                          Private key
                        </div>
                        <div className="current-address">
                          <AddressViewer
                            address={ethers.utils.computeAddress(key)}
                            showArrow={false}
                            className={'text-12 opacity-60'}
                          />
                        </div>
                      </div>
                    </Radio>
                  </div>
                );
              })}
            <div className="p-4 w-full">
              <Radio value={'sync'}>
                <div className="flex flex-row gap-4 items-center">
                  <div className="text-15 ml-6 mr-6" title={'Private key'}>
                    Synchronize with existing key
                  </div>
                </div>
              </Radio>
              <Input
                className="mt-4"
                placeholder="Enter private key..."
                disabled={selectedPrivateKey !== 'sync'}
                onChange={(e) => setPrivateKeyImported(e.target.value)}
              />
            </div>
          </Radio.Group>
        </div>
        <div className="flex justify-between mt-20">
          <Button onClick={() => setPrivateKeys([])} type="default">
            Cancel
          </Button>
          <Button
            disabled={!selectedPrivateKey}
            onClick={async () => {
              try {
                if (selectedPrivateKey === 'sync') {
                  if (
                    privateKeyImported.length < 32 ||
                    !new ethers.Wallet(privateKeyImported)
                  ) {
                    message.error('Invalid private key');
                    return;
                  }
                  run(privateKeyImported);
                  return;
                }
                run(selectedPrivateKey);
              } catch (e) {
                message.error('Invalid private key');
              }
            }}
            type="primary"
          >
            Select
          </Button>
        </div>
      </Modal>
    </>
  );
};
