import { Field, Popup } from '@/ui/component';
import { useRabbySelector } from '@/ui/store';
import { Button, message } from 'antd';
import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import './style.less';
import ThemeIcon from '@/ui/component/ThemeMode/ThemeIcon';
import IconSettingsRabbyBadge from 'ui/assets/badge/rabby-badge-s.svg';
import { ReactComponent as RcIconArrowBlueRight } from 'ui/assets/dashboard/settings/icon-right-arrow-blue.svg';
import { ReactComponent as RcIconArrowOrangeRight } from 'ui/assets/dashboard/settings/icon-right-arrow-orange.svg';
import { useWallet } from '@/ui/utils';
import useConlaAccount from '@/ui/hooks/useConlaAccount';

interface SwitchAccountProps {
  visible: boolean;
  onClose: () => void;
}

export default function SwitchAccount(props: SwitchAccountProps) {
  const { onClose, visible } = props;
  const [accountContract, setAccountContract] = useState('');
  const currentAccount = useRabbySelector(
    (state) => state.account.currentAccount
  );
  const { conlaAccount, handleChangeConlaAccount } = useConlaAccount();

  const wallet = useWallet();

  useEffect(() => {
    (async () => {
      const contract = await wallet.checkIsDeployedAccountContract();
      setAccountContract(contract);
    })();
  }, [currentAccount]);

  const handleSwitch = async (isAccountContract?: boolean) => {
    try {
      handleChangeConlaAccount(isAccountContract ? accountContract : '');
      message.success('Switch account successfully');
      onClose();
    } catch (err) {
      console.log(err);
      message.error('Switch account failed');
    }
  };

  return (
    <Popup
      visible={visible}
      onClose={onClose}
      height={488}
      bodyStyle={{ height: '100%', padding: '20px 20px 0 20px' }}
      destroyOnClose
      className="settings-popup-wrapper"
      isSupportDarkMode
    >
      <div className="popup-settings">
        <div className="setting-block">
          <div className="setting-items">
            <Field
              leftIcon={
                <ThemeIcon src={IconSettingsRabbyBadge} className="w-28 h-28" />
              }
              rightIcon={
                <ThemeIcon
                  src={RcIconArrowBlueRight}
                  className="icon icon-arrow-right w-20 h-20"
                />
              }
              onClick={() => handleSwitch(false)}
              className={`text-blue-light font-medium mb-2 ${
                !conlaAccount && 'bg-r-blue-light-1'
              }`}
            >
              Current Account
            </Field>
          </div>
          <div className="setting-items">
            {accountContract && (
              <Field
                leftIcon={
                  <ThemeIcon
                    src={IconSettingsRabbyBadge}
                    className="w-28 h-28"
                  />
                }
                rightIcon={
                  <ThemeIcon
                    src={RcIconArrowOrangeRight}
                    className="icon icon-arrow-right w-20 h-20"
                  />
                }
                onClick={() => handleSwitch(true)}
                className={`text-blue-light font-medium ${
                  conlaAccount && 'bg-r-blue-light-1'
                }`}
              >
                Account Contract
              </Field>
            )}
          </div>
        </div>
      </div>
    </Popup>
  );
}
