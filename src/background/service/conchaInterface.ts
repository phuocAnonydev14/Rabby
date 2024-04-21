import { ChainWithBalance } from '@rabby-wallet/rabby-api/dist/types';

export interface ConchaBalanceResponse {
  total_usd_value: number;
  chain_list: ChainWithBalance[];
  error_code?: number;
  err_chain_ids?: string[];
}
