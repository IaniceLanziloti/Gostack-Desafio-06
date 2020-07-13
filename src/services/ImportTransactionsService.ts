import csvParse from 'csv-parse';
import path from 'path';
import fs from 'fs';

import { getRepository, In } from 'typeorm';

import Transaction from '../models/Transaction';
import Category from '../models/Category';

interface TransactionData {
  title: string;
  type: 'income' | 'outcome';
  value: number;
  category: string;
}

interface CategoryData {
  title: string;
}

class ImportTransactionsService {
  async execute(filePath: string): Promise<Transaction[]> {
    const transactionRepository = getRepository(Transaction);
    const categoriesRepository = getRepository(Category);

    const transactionsData: TransactionData[] = [];
    const categoryData: CategoryData[] = [];

    const csvFilePath = path.resolve(filePath);
    const readCSVStream = fs.createReadStream(csvFilePath);
    const parseStream = csvParse({
      from_line: 2,
      ltrim: true,
      rtrim: true,
    });

    const parseCSV = readCSVStream.pipe(parseStream);

    parseCSV.on('data', line => {
      const [title, type, value, category] = line;
      transactionsData.push({
        title,
        type,
        value,
        category,
      });

      if (!categoryData.find(elem => elem.title === category)) {
        categoryData.push({ title: category });
      }
    });

    await new Promise(resolve => parseCSV.on('end', resolve));

    const categories = await categoriesRepository.find({
      where: {
        title: In(categoryData.map(category => category.title)),
      },
    });

    const categoriesTitles = categories.map(
      (category: Category) => category.title,
    );

    const categoriesToAdd = categoryData.filter(
      category => !categoriesTitles.includes(category.title),
    );

    const addedCategories = categoriesRepository.create(categoriesToAdd);
    await categoriesRepository.save(addedCategories);

    const categoriesList = [...addedCategories, ...categories];

    const transactions = transactionRepository.create(
      transactionsData.map(transaction => ({
        title: transaction.title,
        category_id: categoriesList.find(
          category => category.title === transaction.category,
        )?.id,
        type: transaction.type,
        value: transaction.value,
      })),
    );
    //
    await transactionRepository.save(transactions);

    await fs.promises.unlink(filePath);

    return transactions;
  }
}

export default ImportTransactionsService;
