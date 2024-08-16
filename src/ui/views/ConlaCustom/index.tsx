import { useRequest } from 'ahooks';
import { TestnetChainBase } from 'background/service/customTestnet';
import { useWallet, useWalletRequest } from 'ui/utils';
import { useEffect, useMemo, useState } from 'react';
import React from 'react';
import { CONLA } from '@/utils/const';
import browser from 'webextension-polyfill';
import { UserOauth } from '@/types/conla-oauth';
import {
  Button,
  Input,
  MenuProps,
  message,
  Modal,
  Radio,
  RadioChangeEvent,
  Tabs,
} from 'antd';
import { AppSocial } from 'aa-conla-social-sdk';
import { KEYRING_TYPE } from '@/constant';
import { useHistory } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { AddressViewer } from '@/ui/component';
import Wallet from 'ethereumjs-wallet';
import { ethers } from 'ethers';
import {
  FileAddOutlined,
  FileSyncOutlined,
  ImportOutlined,
  LeftOutlined,
  LoadingOutlined,
} from '@ant-design/icons';
export function deriveEthAddressFromKey(privateKey: string): string {
  const wallet = Wallet.fromPrivateKey(Buffer.from(privateKey, 'hex'));
  return '0x' + wallet.getAddress().toString('hex');
}

export const ConlaCustom = () => {
  const wallet = useWallet();
  const history = useHistory();
  const { t } = useTranslation();

  const [isLoading, setIsLoading] = useState(false);
  const [selectedPrivateKey, setSelectedPrivateKey] = useState('1');
  const [privateKeys, setPrivateKeys] = useState<
    { privateKey: string; name: string; id: string }[]
  >([]);
  const [privateKeyImported, setPrivateKeyImported] = useState<string>('');
  const [userOauth, setUserOauth] = useState<UserOauth | null>(null);
  const [appSocial, setAppsocial] = useState<AppSocial | null>(null);
  const onChange = (e: RadioChangeEvent) => {
    console.log('radio checked', e.target.value);
    setSelectedPrivateKey(e.target.value);
  };
  const [openModal, setOpenModal] = useState(false);
  const [showSyncIcon, setShowSyncIcon] = useState(false);

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
    const users = await browser.storage.local.get('user_oauth_google');
    await browser.storage.local.remove('user_oauth_google');
    if (users?.user_oauth_google) {
      const userOauth: UserOauth = JSON.parse(users.user_oauth_google);

      const appSocial = new AppSocial(
        'http://localhost:3000/oauth',
        'http://localhost:3000'
      );

      const { email, id, encryptedKey, created_at, updatedAt } = userOauth.user;
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

      // if (
      //   !userOauth.user.encryptedKey ||
      //   userOauth?.user?.encryptedKey?.length <= 0
      // ) {
      //   return Modal.confirm({
      //     title: 'Generate private key',
      //     content: (
      //       <div
      //         className="text-center flex flex-col"
      //         style={{ height: 'max-content' }}
      //       >
      //         <span>Your account didn’t have private key.</span>{' '}
      //         <span>Do you want to generate now?</span>{' '}
      //       </div>
      //     ),
      //     onOk: async () => {
      //       await handleGeneratePrivateKey();
      //     },
      //     okButtonProps: {
      //       loading: isLoading,
      //       disabled: isLoading,
      //     },
      //     okText: 'Generate',
      //   });
      // }

      const privateKey = await appSocial.user?.getPrivateKey(userOauth.idToken);
      console.log('private key sdk', privateKey);

      if (privateKey) {
        localStorage.setItem('privateKey', JSON.stringify(privateKey));
      }
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

  return (
    <>
      <Modal
        onCancel={() => {
          setPrivateKeys([]);
          setOpenModal(false);
          localStorage.removeItem('user_oauth');
          localStorage.removeItem('app_social');
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
                className="flex gap-6 hover:underline font-medium cursor-pointer items-center text-15"
                onClick={() => {
                  if (privateKeys.length <= 0) {
                    message.error("You don't have private key yet");
                    return;
                  }
                  localStorage.removeItem('user_oauth');
                  localStorage.removeItem('app_social');
                  handleImportKey();
                }}
              >
                <ImportOutlined />
                Import private key from account
              </div>
              <div
                onClick={() => setShowSyncIcon(true)}
                className="flex gap-6 hover:underline font-medium cursor-pointer items-center text-15"
              >
                <FileSyncOutlined />
                Synconize with existing private key
              </div>
              <div
                onClick={() => {
                  if (isLoading) return;
                  localStorage.removeItem('user_oauth');
                  localStorage.removeItem('app_social');
                  handleGeneratePrivateKey();
                }}
                style={{ cursor: isLoading ? 'none' : 'pointer' }}
                className="flex gap-6 hover:underline font-medium cursor-pointer items-center text-15"
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
              handleSync={() => {
                localStorage.removeItem('user_oauth');
                localStorage.removeItem('app_social');
                run(privateKeyImported);
              }}
            />
          )}
          {/* <Tabs
            defaultActiveKey="1"
            size={'middle'}
            onChange={(key) => setSelectedPrivateKey(key)}
          >
            <Tabs.TabPane tab="Import" key="1">
              <ul>
                {privateKeys.length > 0 &&
                  privateKeys.map((key) => {
                    return (
                      <li>
                        <div className="option p-4 w-full" key={key.privateKey}>
                          <div className="flex flex-row gap-4 items-center">
                            <div
                              className="text-15 ml-6 mr-6 dashboard-name"
                              title={'Private key'}
                            >
                              {key.name}
                            </div>
                            <div className="current-address">
                              <AddressViewer
                                address={ethers.utils.computeAddress(
                                  key.privateKey
                                )}
                                showArrow={false}
                                className={'text-12 opacity-60'}
                              />
                            </div>
                          </div>
                        </div>
                      </li>
                    );
                  })}
              </ul>
            </Tabs.TabPane>
            <Tabs.TabPane tab="Synconize" key="2">
              
            </Tabs.TabPane>
            <Tabs.TabPane tab="Add new" key="3">
              <div>
                <p>Generate new private key</p>
              </div>
            </Tabs.TabPane>
          </Tabs> */}
        </div>
        {/* <div className="flex justify-between mt-20">
          <Button onClick={() => setPrivateKeys([])} type="default">
            Cancel
          </Button>
          <Button
            disabled={!selectedPrivateKey}
            onClick={async () => {
              try {
                switch (selectedPrivateKey) {
                  case '1': {
                    await handleImportKey(
                      privateKeys.map((key) => key.privateKey)
                    );
                    break;
                  }
                  case '2': {
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
                  case '3': {
                    await handleGeneratePrivateKey();
                    return;
                  }
                }
              } catch (e) {
                message.error('Invalid private key');
              }
            }}
            type="primary"
          >
            {btnSubmitContent}
          </Button>
        </div> */}
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
        className="mt-4"
        type="primary"
        onClick={handleSync}
        disabled={!setPrivateKeyImported}
      >
        Sync
      </Button>
    </div>
  );
};
