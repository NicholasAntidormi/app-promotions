import {
  type BuyXPayYPromotion,
  type ExternalPromotion,
  type FixedAmountPromotion,
  type FixedPricePromotion,
  type FreeGiftPromotion,
  type FreeShippingPromotion,
  type PercentageDiscountPromotion,
} from "@commercelayer/sdk";

export type Promotions =
  | BuyXPayYPromotion
  | ExternalPromotion
  | FixedAmountPromotion
  | FixedPricePromotion
  | FreeGiftPromotion
  | FreeShippingPromotion
  | PercentageDiscountPromotion;
