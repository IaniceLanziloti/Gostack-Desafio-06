import { EntityRepository, Repository } from 'typeorm';

import Transaction from '../models/Transaction';

interface Balance {
  income: number;
  outcome: number;
  total: number;
}

@EntityRepository(Transaction)
class TransactionsRepository extends Repository<Transaction> {
  public async getBalance(): Promise<Balance> {
    const transactions = await this.find({});
    //
    const outcome = transactions
      .filter(transaction => transaction.type === 'outcome')
      .reduce((result, transaction) => result + transaction.value, 0);
    const income = transactions
      .filter(transaction => transaction.type === 'income')
      .reduce((result, transaction) => result + transaction.value, 0);

    const balance: Balance = {
      income,
      outcome,
      total: income - outcome,
    };

    return balance;
  }
}

export default TransactionsRepository;
