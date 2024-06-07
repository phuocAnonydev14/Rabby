import { TestnetChainBase } from '@/background/service/customTestnet';

const CONLA_RPC = 'https://testnet-rpc.conla.com';
// 'http://localhost:8545';
const CONLA: TestnetChainBase = {
  id: 11118,
  name: 'Conla',
  rpcUrl: CONLA_RPC,
  nativeTokenSymbol: 'BTC',
  scanLink: 'https://explorer.conla.com',
  // logo_url: 'https://i.imgur.com/OZGdsJ8.png',
  // logo: 'https://i.imgur.com/OZGdsJ8.png',
};
const rabbyNetworkName = `CUSTOM_${CONLA.id}`;
const entryPointAddr = '0x3bFc49341Aae93e30F6e2BE5a7Fa371cEbd5bea4';

const conlaLogo = 'https://i.imgur.com/OZGdsJ8.png';

const proxyFactory = '0xd2362a44ba6c0b93121ebe99048cf31e8a20f242';
const bundlerUrl = 'http://34.172.46.5:3000/rpc';

export {
  conlaLogo,
  CONLA,
  CONLA_RPC,
  entryPointAddr,
  rabbyNetworkName,
  proxyFactory,
  bundlerUrl,
};
