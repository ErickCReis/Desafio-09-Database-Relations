import { inject, injectable } from 'tsyringe';

import AppError from '@shared/errors/AppError';

import IProductsRepository from '@modules/products/repositories/IProductsRepository';
import ICustomersRepository from '@modules/customers/repositories/ICustomersRepository';
import Order from '../infra/typeorm/entities/Order';
import IOrdersRepository from '../repositories/IOrdersRepository';

interface IProduct {
  id: string;
  quantity: number;
}

interface IRequest {
  customer_id: string;
  products: IProduct[];
}

@injectable()
class CreateOrderService {
  constructor(
    @inject('OrdersRepository')
    private ordersRepository: IOrdersRepository,

    @inject('ProductsRepository')
    private productsRepository: IProductsRepository,

    @inject('CustomersRepository')
    private customersRepository: ICustomersRepository,
  ) {}

  public async execute({ customer_id, products }: IRequest): Promise<Order> {
    const customer = await this.customersRepository.findById(customer_id);

    if (!customer) {
      throw new AppError('Invalid customer_id');
    }

    const dataProducts = await this.productsRepository.findAllById(products);

    const finalProducts = dataProducts.map(dataProduct => {
      const findProduct = products.find(
        product => product.id === dataProduct.id,
      );

      if (!findProduct) {
        throw new Error();
      }

      if (dataProduct.quantity < findProduct.quantity) {
        throw new AppError('insufficient product quantity');
      }

      return {
        orderProducts: {
          product_id: dataProduct.id,
          price: dataProduct.price,
          quantity: findProduct.quantity,
        },
        updatedDataProducts: {
          id: dataProduct.id,
          quantity: dataProduct.quantity - findProduct.quantity,
        },
      };
    });

    const orderProducts = finalProducts.map(
      finalProduct => finalProduct.orderProducts,
    );

    const order = await this.ordersRepository.create({
      customer,
      products: orderProducts,
    });

    const updatedProducts = finalProducts.map(
      finalProduct => finalProduct.updatedDataProducts,
    );

    await this.productsRepository.updateQuantity(updatedProducts);

    return order;
  }
}

export default CreateOrderService;
