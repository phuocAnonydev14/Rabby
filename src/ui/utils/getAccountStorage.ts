export default function getAccountStorage(address) {
  const currentAccount = localStorage.getItem(`accountContract:${address}`);
  return currentAccount || '';
}
