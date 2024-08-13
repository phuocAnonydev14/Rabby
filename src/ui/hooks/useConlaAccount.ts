import { useEffect, useState } from 'react';
import { useRabbySelector } from '../store';

export default function useConlaAccount() {
  const [conlaAccount, setConlaAccount] = useState('');
  const account = useRabbySelector((state) => state.account);

  useEffect(() => {
    (async () => {
      const currentConlaAccount = localStorage.getItem('conlaAccount') || '';
      setConlaAccount(currentConlaAccount);
    })();
  }, [account]);

  const handleChangeConlaAccount = (address?: string) => {
    if (!address) {
      // use conlaAccount to check current account
      localStorage.setItem('conlaAccount', '');
      setConlaAccount('');
    } else {
      localStorage.setItem('conlaAccount', address);
      setConlaAccount(address);
    }
  };

  return {
    conlaAccount,
    handleChangeConlaAccount,
  };
}
