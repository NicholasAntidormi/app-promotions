import type { PromotionConfig } from '../config'
import { genericPromotionOptions } from './promotions'

export default {
  free_shipping_promotions: {
    enable: true,
    type: 'free_shipping_promotions',
    slug: 'free-shipping',
    icon: 'truck',
    titleList: 'Free shipping',
    titleNew: 'free shipping',
    formType: genericPromotionOptions,
    Fields: () => <></>,
    Options: () => <></>
  }
} satisfies Pick<PromotionConfig, 'free_shipping_promotions'>
