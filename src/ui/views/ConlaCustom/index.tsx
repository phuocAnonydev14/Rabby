import { useRequest } from 'ahooks';
import { TestnetChainBase } from 'background/service/customTestnet';
import { useWallet, useWalletRequest } from 'ui/utils';
import { useEffect, useMemo, useState } from 'react';
import React from 'react';
import { CONLA } from '@/utils/const';
import browser from 'webextension-polyfill';
import { UserOauth } from '@/types/conla-oauth';
import { Button, Input, message, Modal, RadioChangeEvent } from 'antd';
import { AppSocial } from 'aa-conla-social-sdk';
import { KEYRING_TYPE } from '@/constant';
import { useHistory } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import Wallet from 'ethereumjs-wallet';
import {
  FileAddOutlined,
  FileSyncOutlined,
  ImportOutlined,
  LeftOutlined,
  LoadingOutlined,
} from '@ant-design/icons';
import { PrivateKey } from 'aa-conla-social-sdk/dist/src/types/social.type';
import { jwtDecode } from 'jwt-decode';
export function deriveEthAddressFromKey(privateKey: string): string {
  const wallet = Wallet.fromPrivateKey(Buffer.from(privateKey, 'hex'));
  return '0x' + wallet.getAddress().toString('hex');
}

export const ConlaCustom = () => {
  const wallet = useWallet();
  const history = useHistory();
  const { t } = useTranslation();

  const [isLoading, setIsLoading] = useState(false);
  const [privateKeys, setPrivateKeys] = useState<PrivateKey[]>([]);
  const [privateKeyImported, setPrivateKeyImported] = useState<string>('');
  const [userOauth, setUserOauth] = useState<UserOauth | null>(null);
  const [appSocial, setAppsocial] = useState<AppSocial | null>(null);
  const [openModal, setOpenModal] = useState(false);
  const [showSyncIcon, setShowSyncIcon] = useState(false);
  const [fetchingKey, setFetchingKey] = useState(false);

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

  const handleImportKey = async () => {
    try {
      // const importedAccounts = await wallet.getTypedAccounts(
      //   KEYRING_TYPE.SimpleKeyring
      // );
      // const accounts: any[] = [];
      // for (let i = 0; i < privateKeys.length; i++) {
      //   const privateKey = privateKeys[i];
      //   const newAccount = await wallet.importPrivateKey(privateKey);
      //   const successShowAccounts = newAccount.map((item, index) => {
      //     return { ...item, index: index + 1 };
      //   });
      //   accounts.push(successShowAccounts[0]);
      // }
      history.replace({
        pathname: '/popup/import/oauth',
        state: {
          // accounts: accounts,
          title: 'Imported Account',
          editing: true,
          importedAccount: true,
          // importedLength: importedAccounts.length,
          idToken: userOauth?.idToken,
          appSocial,
          privateKeys,
        },
      });
    } catch (e) {
      console.log(e);
    }
  };

  const handleGeneratePrivateKey = async () => {
    try {
      let userOauthUse = userOauth;
      if (!userOauth) {
        userOauthUse = JSON.parse(localStorage.getItem('user_oauth') || '{}');
      }
      let appSocialUse = appSocial;
      if (!appSocial) {
        appSocialUse = JSON.parse(localStorage.getItem('app_social') || '{}');
      }
      if (!appSocialUse || !userOauthUse) return;
      setIsLoading(true);
      console.log('start generate');

      const privateKey = await appSocialUse.user?.generatePrivateKey(
        undefined,
        userOauthUse.idToken
      );

      await run(privateKey);
      message.success('Generate successfully');
      localStorage.removeItem('user_oauth');
      localStorage.removeItem('app_social');
    } catch (e: any) {
      console.log(e);
      message.error(e.message || 'Server error');
    } finally {
      setIsLoading(false);
    }
  };

  const checkUserRedirectOauth = async () => {
    try {
      const users = await browser.storage.local.get('user_oauth_google');
      if (users?.user_oauth_google) {
        setFetchingKey(true);
        const userOauth: UserOauth = JSON.parse(users.user_oauth_google);
        const decodedHeader = jwtDecode(userOauth.idToken);
        if (decodedHeader.exp && Date.now() >= decodedHeader.exp * 1000) {
          await handleClearCache();
          return;
        }
        const appSocial = new AppSocial(
          'http://localhost:3000/oauth',
          'http://localhost:3000'
        );

        const {
          email,
          id,
          encryptedKey,
          created_at,
          updatedAt,
        } = userOauth.user;
        appSocial.user?.setInformation(
          email,
          id,
          encryptedKey,
          created_at,
          updatedAt
        );

        localStorage.setItem('app_social', JSON.stringify(appSocial));
        localStorage.setItem('user_oauth', JSON.stringify(userOauth));

        setUserOauth(userOauth);
        setAppsocial(appSocial);
        setOpenModal(true);

        const privateKey = await appSocial.user?.getPrivateKey(
          userOauth.idToken
        );
        console.log('private key sdk', privateKey);

        if (privateKey) {
          setPrivateKeys(privateKey);
          localStorage.setItem('privateKey', JSON.stringify(privateKey));
        }
      }
    } catch (e) {
      console.log(e);
    } finally {
      setFetchingKey(false);
    }
  };

  useEffect(() => {
    const interval = setInterval(() => {
      const privateKeyLocal = localStorage.getItem('privateKey');
      const isUserOauth = localStorage.getItem('user_oauth');
      if (isUserOauth) {
        setOpenModal(true);
      }
      if (!privateKeyLocal) return;
      setPrivateKeys(JSON.parse(privateKeyLocal));
      localStorage.removeItem('privateKey');
    }, 500);

    return () => {
      clearInterval(interval);
    };
  }, []);

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

  const handleClearCache = async () => {
    localStorage.removeItem('user_oauth');
    localStorage.removeItem('app_social');
    await browser.storage.local.remove('user_oauth_google');
  };

  return (
    <>
      <Modal
        onCancel={async () => {
          setPrivateKeys([]);
          setOpenModal(false);
          localStorage.removeItem('user_oauth');
          localStorage.removeItem('app_social');
          await browser.storage.local.remove('user_oauth_google');
        }}
        footer={null}
        visible={openModal}
        title="Add accounts"
        className="relative"
      >
        <div className="px-8 overflow-hidden w-full">
          {!showSyncIcon ? (
            <div className="flex flex-col gap-14">
              <div
                className={`flex gap-6 hover:underline font-medium cursor-${
                  fetchingKey ? 'auto' : 'pointer'
                } ${
                  fetchingKey ? 'text-gray-content' : ''
                } items-center text-15`}
                onClick={async () => {
                  if (privateKeys.length <= 0) {
                    message.error("You don't have private key yet");
                    return;
                  }
                  await handleClearCache();

                  handleImportKey();
                }}
              >
                <ImportOutlined />
                Import private key from account
                {fetchingKey && <LoadingOutlined />}
              </div>
              <div
                onClick={() => setShowSyncIcon(true)}
                className="flex gap-6 hover:underline font-medium cursor-pointer items-center text-15"
              >
                <FileSyncOutlined />
                Synconize with existing private key
              </div>
              <div
                onClick={async () => {
                  if (isLoading) return;
                  await handleClearCache();
                  await handleGeneratePrivateKey();
                }}
                style={{ cursor: isLoading ? 'none' : 'pointer' }}
                className={`cursor-${isLoading ? 'auto' : 'pointer'} ${
                  isLoading ? 'text-gray-content' : ''
                } flex gap-6 hover:underline font-medium cursor-pointer items-center text-15`}
              >
                <FileAddOutlined />
                Generate new private key
                {isLoading && <LoadingOutlined />}
              </div>
            </div>
          ) : (
            <SyncKey
              onBack={() => setShowSyncIcon(false)}
              setPrivateKeyImported={setPrivateKeyImported}
              handleSync={async () => {
                localStorage.removeItem('user_oauth');
                localStorage.removeItem('app_social');
                await browser.storage.local.remove('user_oauth_google');

                run(privateKeyImported);
              }}
            />
          )}
        </div>
      </Modal>
    </>
  );
};

const SyncKey = ({
  setPrivateKeyImported,
  onBack,
  handleSync,
}: {
  setPrivateKeyImported: (e: string) => void;
  onBack: () => void;
  handleSync: () => void;
}) => {
  return (
    <div className="p-4 w-full">
      <div className="flex flex-row gap-4 items-center">
        <div className="text-15 ml-6 mr-6 text-center" title={'Private key'}>
          <LeftOutlined
            onClick={onBack}
            className="absolute left-10 top-18 cursor-pointer"
          />
          Synchronize with existing key
        </div>
      </div>
      <Input
        className="mt-4"
        placeholder="Enter private key..."
        onChange={(e) => setPrivateKeyImported(e.target.value)}
      />
      <Button
        block
        className="mt-10"
        type="primary"
        onClick={handleSync}
        disabled={!setPrivateKeyImported}
      >
        Sync
      </Button>
    </div>
  );
};
