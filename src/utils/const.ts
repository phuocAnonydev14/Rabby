const CONLA_RPC = 'http://localhost:8545';
// 'http://localhost:8545';
const CONLA = {
  id: 1337,
  name: 'Conla',
  rpcUrl: CONLA_RPC,
  nativeTokenSymbol: 'ETH',
  logo_url: 'https://i.imgur.com/OZGdsJ8.png',
  logo: 'https://i.imgur.com/OZGdsJ8.png',
};
const rabbyNetworkName = `CUSTOM_${CONLA.id}`;
const entryPointAddr = '0x0000000071727De22E5E9d8BAf0edAc6f37da032';

const conlaLogo = 'https://i.imgur.com/OZGdsJ8.png';

const proxyFactory = '0x2b6a6752f44fb5bb9ed649B82ec133BD1E2bD8cA';
const bundlerUrl = 'http://localhost:3000/rpc';

export {
  conlaLogo,
  CONLA,
  CONLA_RPC,
  entryPointAddr,
  rabbyNetworkName,
  proxyFactory,
  bundlerUrl,
};
