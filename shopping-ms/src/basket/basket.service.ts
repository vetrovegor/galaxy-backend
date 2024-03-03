import { Injectable, NotFoundException } from '@nestjs/common';
import { BasketProductDto } from './dto/basket-product.dto';
import { InjectModel } from '@nestjs/sequelize';
import { Basket } from './basket.entity';
import { ProductService } from '@product/product.service';

@Injectable()
export class BasketService {
    constructor(
        @InjectModel(Basket) private readonly basketModel: typeof Basket,
        private readonly productService: ProductService
    ) { }

    async addProduct({ productId }: BasketProductDto, userId: string) {
        await this.productService.findById(productId);

        const existedBasketItem = await this.basketModel.findOne({
            where: { productId, userId }
        });

        if (!existedBasketItem) {
            return await this.basketModel.create({ productId, userId, quantity: 1 });
        }

        existedBasketItem.quantity++;

        return await existedBasketItem.save();
    }

    async removeProduct(productId: string, userId: string) {
        const existedBasketItem = await this.basketModel.findOne({
            where: { productId, userId }
        });

        if (!existedBasketItem) {
            throw new NotFoundException('Продукт не найден');
        }

        if (existedBasketItem.quantity == 1) {
            return await existedBasketItem.destroy();
        }

        existedBasketItem.quantity--;

        return await existedBasketItem.save();
    }

    async get(userId: string) {
        const basketItems = await this.basketModel.findAll({
            where: { userId }
        });

        const basket = await Promise.all(
            basketItems.map(async ({ id, quantity, productId }) => {
                const product = await this.productService.findById(productId);

                return {
                    id,
                    product,
                    quantity
                };
            })
        );

        return { basket };
    }
}
