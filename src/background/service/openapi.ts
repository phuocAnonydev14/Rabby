import { INITIAL_OPENAPI_URL, INITIAL_TESTNET_OPENAPI_URL } from '@/constant';
import { OpenApiService } from '@rabby-wallet/rabby-api';
import { createPersistStore } from 'background/utils';
export * from '@rabby-wallet/rabby-api/dist/types';
import { WebSignApiPlugin } from '@rabby-wallet/rabby-api/dist/plugins/web-sign';
import fetchAdapter from '@vespaiach/axios-fetch-adapter';

const testnetStore = new (class TestnetStore {
  store!: { host: string; testnetHost: string };

  constructor() {
    createPersistStore({
      name: 'openapi',
      template: {
        host: 'https://api.rabby.io',
        testnetHost: 'https://api.testnet.rabby.io',
      },
    }).then((res) => {
      this.store = res;
    });
  }
  get host() {
    return this.store.testnetHost;
  }
  set host(value) {
    this.store.testnetHost = value;
  }
})();

const service = new OpenApiService({
  plugin: WebSignApiPlugin,
  adapter: fetchAdapter,
  store: {
    host: 'https://api.rabby.io',
    testnetHost: 'https://api.testnet.rabby.io',
  },
});

export const testnetOpenapiService = new OpenApiService({
  plugin: WebSignApiPlugin,
  adapter: fetchAdapter,
  store: {
    host: 'https://api.testnet.rabby.io',
    testnetHost: 'https://api.testnet.rabby.io',
  },
});

export default service;
