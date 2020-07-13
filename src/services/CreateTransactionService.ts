import { getRepository, getCustomRepository } from 'typeorm';

import AppError from '../errors/AppError';

import TransactionRepository from '../repositories/TransactionsRepository';
import Transaction from '../models/Transaction';
import Category from '../models/Category';

interface RequestDTO {
  title: string;
  value: number;
  type: 'income' | 'outcome';
  category: string;
}

class CreateTransactionService {
  public async execute({
    title,
    value,
    type,
    category,
  }: RequestDTO): Promise<Transaction> {
    let category_id = '';
    //
    const categoryRepository = getRepository(Category);
    const transactionRepository = getCustomRepository(TransactionRepository);

    if (type === 'outcome') {
      const {
        total: balanceAvailable,
      } = await transactionRepository.getBalance();

      if (balanceAvailable < value) {
        throw new AppError('Insufficient balance to withdraw');
      }
    }

    const categoryExists = await categoryRepository.findOne({
      title: category,
    });
    //
    if (categoryExists) {
      category_id = categoryExists.id;
    } else {
      const categoryInstance = await categoryRepository.create({
        title: category,
      });
      await categoryRepository.save(categoryInstance);

      category_id = categoryInstance.id;
    }

    const transaction = await transactionRepository.create({
      title,
      value,
      type,
      category_id,
    });

    await transactionRepository.save(transaction);

    return transaction;
  }
}

export default CreateTransactionService;
