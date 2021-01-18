import { getRepository, Repository, In } from 'typeorm';

import AppError from '@shared/errors/AppError';
import IProductsRepository from '@modules/products/repositories/IProductsRepository';
import ICreateProductDTO from '@modules/products/dtos/ICreateProductDTO';
import IUpdateProductsQuantityDTO from '@modules/products/dtos/IUpdateProductsQuantityDTO';
import Product from '../entities/Product';

interface IFindProducts {
  id: string;
}

class ProductsRepository implements IProductsRepository {
  private ormRepository: Repository<Product>;

  constructor() {
    this.ormRepository = getRepository(Product);
  }

  public async create({
    name,
    price,
    quantity,
  }: ICreateProductDTO): Promise<Product> {
    const product = await this.ormRepository.save({ name, price, quantity });

    return product;
  }

  public async findByName(name: string): Promise<Product | undefined> {
    const product = await this.ormRepository.findOne({
      where: {
        name,
      },
    });

    return product;
  }

  public async findAllById(products: IFindProducts[]): Promise<Product[]> {
    const productsIds = products.map(product => product.id);

    const findProducts = await this.ormRepository.find({
      where: {
        id: In(productsIds),
      },
    });

    if (productsIds.length !== findProducts.length) {
      throw new AppError('Missing Product');
    }

    return findProducts;
  }

  public async updateQuantity(
    products: IUpdateProductsQuantityDTO[],
  ): Promise<Product[]> {
    const savePromises = products.map(async product => {
      return this.ormRepository.save({
        id: product.id,
        quantity: product.quantity,
      });
    });

    const updatedProducts = await Promise.all(savePromises);

    return updatedProducts;
  }
}

export default ProductsRepository;
