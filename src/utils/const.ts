import { TestnetChainBase } from '@/background/service/customTestnet';

const CONLA_RPC = 'https://rpc.testnet.conla.com ';
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

const proxyFactory = '0x9b7463999321c8551e53faf2062c77993B025fDC';
const bundlerUrl = 'https://aa-bundler.conla.com/rpc';
const beneficiary = '0xEE35dA6bA29cc1A60d0d9042fa8c88CbEA6d12c0';
export {
  conlaLogo,
  CONLA,
  CONLA_RPC,
  entryPointAddr,
  rabbyNetworkName,
  proxyFactory,
  bundlerUrl,
  beneficiary,
};
