import React, { useState, useEffect } from 'react';
import { useHistory, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useApproval, useWallet } from 'ui/utils';
import { Account } from 'background/service/preference';
import { KEYRING_TYPE } from 'consts';
import './index.less';
import { useMedia } from 'react-use';
import { connectStore, useRabbyDispatch } from '@/ui/store';
import { Chain } from '@debank/common';
import { AppSocial } from 'aa-conla-social-sdk';
import {
  Button,
  Checkbox,
  Dropdown,
  Menu,
  message,
  Modal,
  Typography,
} from 'antd';
import { DeleteOutlined, MoreOutlined } from '@ant-design/icons';
import { ethers } from 'ethers';
import _ from 'lodash';

const ImportedPrivateKey = ({ isPopup = false }: { isPopup?: boolean }) => {
  const history = useHistory();
  const { state } = useLocation<{
    accounts: Account[];
    hasDivider: boolean;
    title: string;
    brand?: string;
    image?: string;
    editing?: boolean;
    showImportIcon?: boolean;
    isMnemonics?: boolean;
    importedLength?: number;
    supportChainList?: Chain[];
    idToken: string;
    appSocial: AppSocial;
    privateKeys: { privateKey: string; name: string; id: string }[];
  }>();

  console.log('state', state);

  const dispatch = useRabbyDispatch();
  // const addressItems = useRef(new Array(state.accounts.length));
  const { t } = useTranslation();
  const isWide = useMedia('(min-width: 401px)') && isPopup;
  const { accounts, idToken, appSocial, privateKeys } = state;
  const [, resolveApproval] = useApproval();
  const [selectedImportAccount, setSelectedImportAccount] = useState<string[]>(
    []
  );
  const [availableAddressres, setAvailableAddressres] = useState<any[]>([]);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const wallet = useWallet();
  const [privateKeyState, setPrivateKeyState] = useState(privateKeys);
  const handleImport = async () => {
    try {
      const importedAccounts = await wallet.getTypedAccounts(
        KEYRING_TYPE.SimpleKeyring
      );
      const accounts: any[] = [];
      for (let i = 0; i < selectedImportAccount.length; i++) {
        const privateKey = selectedImportAccount[i];
        const newAccount = await wallet.importPrivateKey(privateKey);
        const successShowAccounts = newAccount.map((item, index) => {
          return { ...item, index: index + 1 };
        });
        accounts.push(successShowAccounts[0]);
      }
      history.replace({
        pathname: '/popup/import/success',
        state: {
          accounts: accounts,
          title: 'Imported Account',
          editing: true,
          importedAccount: true,
          importedLength: importedAccounts.length,
          idToken: idToken,
          appSocial,
          privateKeys,
        },
      });
    } catch (e: any) {
      message.error(
        e?.message || t('page.newAddress.privateKey.notAValidPrivateKey')
      );
    }
  };

  useEffect(() => {
    (async () => {
      try {
        const addresses = await wallet.getAllVisibleAccounts();
        console.log('addresses', addresses);
        setAvailableAddressres(addresses);
      } catch (e) {
        console.log(e);
      }
    })();
  }, []);

  return (
    <div className="w-full">
      <div className="p-40 bg-blue-light  mb-24">
        <h1 className="text-center font-semibold text-white">
          Account management
        </h1>
      </div>
      <div className="w-full px-20 pb-32">
        <Checkbox.Group className="w-full">
          <div className="flex flex-col gap-[8px] w-full">
            {privateKeyState.map(({ name, privateKey, id }, index) => {
              const isDuplicate = availableAddressres.find((item) => {
                return (
                  item.accounts[0].address.toLowerCase() ===
                  ethers.utils.computeAddress(privateKey).toLowerCase()
                );
              });
              console.log('isDuplicate', isDuplicate);
              return (
                <div
                  className={`w-full p-4 flex justify-between ${
                    isDuplicate
                      ? 'bg-[#dbe0ff]'
                      : selectedImportAccount.includes(privateKey)
                      ? 'bg-[#F5E4CB]'
                      : 'bg-transparent'
                  }`}
                >
                  <Checkbox
                    className=" p-4"
                    onChange={(e) => {
                      console.log(availableAddressres);
                      const isDuplicate = availableAddressres.find((item) => {
                        console.log(
                          item.accounts[0].address.toLowerCase(),
                          ethers.utils.computeAddress(privateKey).toLowerCase()
                        );
                        return (
                          item.accounts[0].address.toLowerCase() ===
                          ethers.utils.computeAddress(privateKey).toLowerCase()
                        );
                      });
                      if (isDuplicate) {
                        message.error(t('Account already exists'));
                        e.stopPropagation();
                        e.preventDefault();
                        return;
                      }
                      setSelectedImportAccount((state) => {
                        if (e.target.checked) {
                          return [...state, privateKey];
                        } else {
                          return state.filter((item) => item !== privateKey);
                        }
                      });
                    }}
                    checked={selectedImportAccount.includes(privateKey)}
                    value={privateKey}
                    key={privateKey}
                  >
                    <div className="flex flex-col">
                      <div className="flex justify-between w-full">
                        <p className="font-semibold text-15 mb-6">{name}</p>
                        <div>
                          <Dropdown
                            overlay={
                              <Menu>
                                <Menu.Item
                                  danger
                                  className="flex gap-2 items-center"
                                  key={'1'}
                                  onClick={() => {
                                    // handle delete
                                    Modal.confirm({
                                      title:
                                        'Are you sure you want to delete this account?',
                                      okText: 'Delete',
                                      content: 'This action cannot be undone.',
                                      onOk: async () => {
                                        try {
                                          await appSocial.user?.deletePrivateKey(
                                            id,
                                            idToken
                                          );
                                          setPrivateKeyState((state) => {
                                            return state.filter(
                                              (item) => item.id !== id
                                            );
                                          });
                                          message.success('Delete success');
                                        } catch (e) {
                                          console.log(e);
                                          message.error('Delete failed');
                                        }
                                      },
                                      cancelText: 'Cancel',
                                    });
                                  }}
                                >
                                  <DeleteOutlined className="text-red" /> Delete
                                </Menu.Item>
                              </Menu>
                            }
                            placement="bottomRight"
                            arrow
                          >
                            <Button
                              type="text"
                              size="small"
                              style={{ transform: 'translateX(10px)' }}
                            >
                              <MoreOutlined />
                            </Button>
                          </Dropdown>
                        </div>
                      </div>
                      <Typography.Paragraph
                        copyable={{
                          text: ethers.utils.computeAddress(privateKey),
                        }}
                        className="text-gray-subTitle overflow-ellipsis flex gap-1 text-12"
                      >
                        {ethers.utils.computeAddress(privateKey)}
                      </Typography.Paragraph>
                    </div>
                  </Checkbox>
                </div>
              );
            })}
          </div>
        </Checkbox.Group>
      </div>
      <div className="fixed bottom-0 w-full">
        <Button
          disabled={!selectedImportAccount.length}
          className="w-full"
          block
          type="primary"
          size="large"
          onClick={handleImport}
        >
          Import
        </Button>
      </div>
    </div>
  );
};

export default connectStore()(ImportedPrivateKey);
