import { useEffect, useState } from 'react';

export default function useConlaAccount() {
  const [conlaAccount, setConlaAccount] = useState('');

  useEffect(() => {
    (async () => {
      const currentConlaAccount = localStorage.getItem('conlaAccount') || '';
      setConlaAccount(currentConlaAccount);
    })();
  }, []);

  const handleChangeConlaAccount = (address?: string) => {
    if (!address) {
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
