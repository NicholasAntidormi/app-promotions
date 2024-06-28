import { indexBy } from "#data/array";
import { getCustomPromotionRelationships } from "#data/customPromotions";
import { type Promotions } from "#data/promotions";

export const indexById = <Item extends { id?: string | null }>(
  items: Array<Item | null | undefined>
) =>
  indexBy(
    items.filter((item): item is NonNullable<typeof item> => !!item?.id),
    (item) => item.id!
  );

export const compareField = {
  promotions: "name",
  markets: "code",
  sku_lists: "name",
  tags: "name",
} as const;
type CompareField = typeof compareField;

export const indexByCompareField = <
  Type extends keyof CompareField,
  Item extends {
    type: Type;
  } & {
    [key in CompareField[Type]]?: string | null;
  },
>(
  items: Array<Item | null | undefined>
) =>
  indexBy(
    items.filter(
      (item): item is NonNullable<typeof item> =>
        !!item?.[compareField[item.type]]
    ),
    (item) => item[compareField[item.type]]!
  );

export const isComparable = (
  promotion: Promotions,
  log: (...args: any[]) => void
) => {
  const hasComparableField = !!promotion?.[compareField.promotions];
  const isMarketComparable =
    !promotion.market || !!promotion.market[compareField.markets];

  const isSkuListComparable =
    !promotion.sku_list || !!promotion.sku_list[compareField.sku_lists];

  const isSkuListRuleComparable =
    !promotion.sku_list_promotion_rule?.sku_list ||
    !!promotion.sku_list_promotion_rule.sku_list[compareField.sku_lists];

  const isComparable =
    hasComparableField &&
    isMarketComparable &&
    isSkuListComparable &&
    isSkuListRuleComparable;

  if (!isComparable) {
    log(`Promotion "${promotion.name}" (${promotion.id}) is not comparable`);

    if (!hasComparableField) {
      log(`Missing field ${compareField.promotions} in promotion`);
    }
    if (!isMarketComparable) {
      log(`Missing field ${compareField.markets} in promotion market`);
    }
    if (!isSkuListComparable) {
      log(`Missing field ${compareField.sku_lists} in promotion sku list`);
    }
    if (!isSkuListRuleComparable) {
      log(`Missing field ${compareField.sku_lists} in promotion rule sku list`);
    }
  }

  return isComparable;
};

export const areRelationshipsComparable = (
  relationshipsById: Record<string, any>,
  promotion: Promotions,
  log: (...args: any[]) => void
) => {
  const customPromotionRelationships = getCustomPromotionRelationships(
    promotion.custom_promotion_rule
  );

  const notComparableRelationships = customPromotionRelationships.filter(
    (rule) =>
      rule.rel &&
      rule.rawValues.some(
        (value) => !relationshipsById[value]?.[compareField[rule.rel!]]
      )
  );

  if (notComparableRelationships.length > 0) {
    log(
      `Promotion "${promotion.name}" (${promotion.id}) has not comparable relationships`
    );
    log(
      notComparableRelationships
        .map((rule) => rule.rel + " " + rule.value)
        .join(", ")
    );
  }

  return notComparableRelationships.length === 0;
};

export const compare = (
  testRelationshipsById: Record<string, any>,
  prodRelationshipsByCompareField: Record<string, any>,
  promotion: Promotions,
  log: (...args: any[]) => void
) => {
  const marketCompareResult =
    !promotion.market ||
    !!prodRelationshipsByCompareField[promotion.market[compareField.markets]!];

  const skuListCompareResult =
    !promotion.sku_list ||
    !!prodRelationshipsByCompareField[
      promotion.sku_list[compareField.sku_lists]
    ];

  const skuListRuleCompareResult =
    !promotion.sku_list_promotion_rule?.sku_list ||
    !!prodRelationshipsByCompareField[
      promotion.sku_list_promotion_rule.sku_list[compareField.sku_lists]
    ];

  const notFoundRelationships = getCustomPromotionRelationships(
    promotion.custom_promotion_rule
  ).filter(
    (rule) =>
      rule.rel &&
      rule.rawValues.some(
        (value) =>
          !prodRelationshipsByCompareField[
            testRelationshipsById[value][compareField[rule.rel!]]
          ]
      )
  );
  const relationshipsResult = notFoundRelationships.length === 0;

  const compareResult =
    marketCompareResult &&
    skuListCompareResult &&
    skuListRuleCompareResult &&
    relationshipsResult;

  if (!compareResult) {
    log(`Promotion "${promotion.name}" (${promotion.id}) is not comparable`);
  }
  if (!marketCompareResult) {
    log("Market not found", promotion.market?.[compareField.markets]);
  }
  if (!skuListCompareResult) {
    log("Sku list not found", promotion.sku_list?.[compareField.sku_lists]);
  }
  if (!skuListRuleCompareResult) {
    log(
      "Rule sku list not found",
      promotion.sku_list_promotion_rule?.sku_list?.[compareField.sku_lists]
    );
  }
  if (!relationshipsResult) {
    log(
      "Custom relationship not found",
      notFoundRelationships
        .map(
          (rule) =>
            `${rule.rel} (${rule.rawValues
              .map(
                (value) => testRelationshipsById[value][compareField[rule.rel!]]
              )
              .join(", ")})`
        )
        .join(", ")
    );
  }

  return compareResult;
};

export const query = {
  include: [
    "market",
    "sku_list",
    "order_amount_promotion_rule",
    "sku_list_promotion_rule",
    "sku_list_promotion_rule.sku_list",
    "coupon_codes_promotion_rule",
    "custom_promotion_rule",
  ],
};
