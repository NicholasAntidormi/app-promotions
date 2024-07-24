/* eslint-disable @typescript-eslint/no-unsafe-argument */
/* eslint-disable @typescript-eslint/explicit-function-return-type */
/* eslint-disable @typescript-eslint/no-non-null-assertion */
/* eslint-disable @typescript-eslint/strict-boolean-expressions */
/* eslint-disable prettier/prettier */
import { getCustomPromotionRelationships } from "#data/customPromotions";
import { type Promotions } from "#data/promotions";
import { pick } from "#data/record";
import { type CommerceLayerClient } from "@commercelayer/sdk";
import { CommerceLayerUtils, retrieveAll } from "@commercelayer/sdk-utils";
import {
  areRelationshipsComparable,
  compare,
  compareField,
  groupById,
  indexByCompareField,
  isComparable,
  query,
} from "./shared";

export const prepareImportPromotions = async (
  cl: CommerceLayerClient,
  promotionsTest: any,
  relationshipsByIdTest: any,
  relationshipsTypesTest: any,
  log: (...args: any[]) => void
) => {
  CommerceLayerUtils(cl);
  // fetch data
  // Fetch all promotions, with rules (and eventual relationships), market, sku list.
  log("Retrieving all promotions...");
  const allPromotions = await retrieveAll<Promotions>("promotions", query);
  log("Promotions:", allPromotions.length);

  // Discard promotions that do not have necessary fields for identity.
  const comparablePromotions = allPromotions.filter(isComparable);
  log("Comparable promotions:", comparablePromotions.length);

  log("Retrieving all promotions relationships...");
  const relationshipsByType: Record<string, any> = {};
  for (const relationshipsType of relationshipsTypesTest) {
    log(`Fetching ${relationshipsType}...`);
    relationshipsByType[relationshipsType] =
      await retrieveAll(relationshipsType);
    log(`${relationshipsType}:`, relationshipsByType[relationshipsType].length);
  }

  const relationshipsById = groupById(
    Object.values(relationshipsByType).flat()
  );
  const relationshipsByCompareField = indexByCompareField(
    Object.values(relationshipsByType).flat()
  );
  log(`Relationships:`, Object.keys(relationshipsById).length);
  log(Object.keys(relationshipsById).join(", "));
  log(Object.keys(relationshipsByCompareField).join(", "));

  // Discard promotions that do not have relationships with necessary fields for identity.
  // @ts-expect-error not found types
  const promotions = comparablePromotions.filter((promotion) =>
    areRelationshipsComparable(relationshipsById, promotion, log)
  );
  log("Syncable promotions:", promotions.length);

  // Discard promotions that do not have relationships with equivalent entities.
  // @ts-expect-error not found types
  const promotionsToSync = promotionsTest.filter((promotion) =>
    compare(relationshipsByIdTest, relationshipsByCompareField, promotion, log)
  );
  log("Syncable promotions:", promotionsToSync.length);

  return {
    promotionsToSync,
    allPromotions,
    relationshipsByIdTest,
    relationshipsByCompareField,
  };
};

export const importPromotions = async (
  cl: CommerceLayerClient,
  promotionsToSync: any,
  allPromotions: any,
  relationshipsByIdTest: any,
  relationshipsByCompareField: any,
  log: (...args: any[]) => void
) => {
  // SYNC STEP (add and update)
  for (const promotion of promotionsToSync) {
    const prodPromotion = allPromotions.find(
      // @ts-expect-error not found types
      (prodPromotion) =>
        prodPromotion[compareField.promotions] ===
        promotion[compareField.promotions]
    );
    // Create disabled promotions with already existing relationships
    // Create rules with already existing relationships
    try {
      await createPromotion(
        cl,
        promotion,
        prodPromotion,
        relationshipsByIdTest,
        relationshipsByCompareField,
        log
      );
    } catch (err) {
      // @ts-expect-error err.errors fields exists
      log("Error", err, err?.errors);
    }
  }
  log("Done");
};

const sharedAttributes = ["metadata", "reference", "reference_origin"] as const;
const getAction = <T>(v?: T) => (v ? "update" : "create");
const getId = (v: { id: string } | null | undefined) => (v ? { id: v.id } : {});
const getPromotionRel = (action: "create" | "update", promotion: Promotions) =>
  action === "create"
    ? {
        promotion: {
          type: promotion.type,
          id: promotion.id,
        },
      }
    : {};

const sharedRuleAttributes = sharedAttributes;

const createRules = async (
  clientProd: CommerceLayerClient,
  promotion: Promotions,
  prodPromotion: Promotions,
  testRelationshipsById: Record<string, any>,
  prodRelationshipsByCompareField: Record<string, any>,
  log: (...args: any[]) => void
) => {
  if (promotion.order_amount_promotion_rule) {
    const action = getAction(prodPromotion.order_amount_promotion_rule);
    log(`Order amount promotion rule ${action}...`);
    await clientProd.order_amount_promotion_rules[action]({
      ...getId(prodPromotion.order_amount_promotion_rule),
      // @ts-expect-error too flexible for js
      ...pick(promotion.order_amount_promotion_rule, sharedRuleAttributes),
      order_amount_cents:
        promotion.order_amount_promotion_rule.order_amount_cents,
      use_subtotal: promotion.order_amount_promotion_rule.use_subtotal,
      ...getPromotionRel(action, prodPromotion),
    });
  } else if (prodPromotion.order_amount_promotion_rule) {
    log(`Order amount promotion rule delete...`);
    await clientProd.order_amount_promotion_rules.delete(
      prodPromotion.order_amount_promotion_rule.id
    );
  }
  if (promotion.sku_list_promotion_rule) {
    const action = getAction(prodPromotion.sku_list_promotion_rule);
    const testSkuList = promotion.sku_list_promotion_rule.sku_list!;
    const compareValue = testSkuList[compareField.sku_lists];
    const skuList = prodRelationshipsByCompareField[compareValue];
    log(`Sku list promotion rule ${action}...`);
    await clientProd.sku_list_promotion_rules[action]({
      ...getId(prodPromotion.sku_list_promotion_rule),
      // @ts-expect-error too flexible for js
      ...pick(promotion.sku_list_promotion_rule, sharedRuleAttributes),
      all_skus: promotion.sku_list_promotion_rule.all_skus,
      min_quantity: promotion.sku_list_promotion_rule.min_quantity,
      sku_list: {
        type: "sku_lists",
        id: skuList.id,
      },
      ...getPromotionRel(action, prodPromotion),
    });
  } else if (prodPromotion.sku_list_promotion_rule) {
    log(`Sku list promotion rule delete...`);
    await clientProd.sku_list_promotion_rules.delete(
      prodPromotion.sku_list_promotion_rule.id
    );
  }
  if (promotion.coupon_codes_promotion_rule) {
    const action = getAction(prodPromotion.coupon_codes_promotion_rule);
    log(`Coupon codes promotion rule ${action}...`);
    const rule = await clientProd.coupon_codes_promotion_rules[action]({
      ...getId(prodPromotion.coupon_codes_promotion_rule),
      // @ts-expect-error too flexible for js
      ...pick(promotion.coupon_codes_promotion_rule, sharedRuleAttributes),
      ...getPromotionRel(action, prodPromotion),
    });
    if (action === "create") {
      log(`Placeholder coupon create...`);
      await clientProd.coupons.create({
        code: "PLACEHOLDER_TO_NOT_ACTIVATE_PROMOTION",
        usage_limit: 1,
        expires_at: new Date(0).toISOString(),
        recipient_email: "coupon@placeholder.com",
        reference: "placeholder",
        reference_origin: "app-sync-promotions",
        promotion_rule: {
          id: rule.id,
          type: "coupon_codes_promotion_rules",
        },
      });
    }
  } else if (prodPromotion.coupon_codes_promotion_rule) {
    log(`Coupon codes promotion rule delete...`);
    await clientProd.coupon_codes_promotion_rules.delete(
      prodPromotion.coupon_codes_promotion_rule.id
    );
  }
  if (promotion.custom_promotion_rule) {
    const action = getAction(prodPromotion.custom_promotion_rule);

    const filters = Object.fromEntries(
      getCustomPromotionRelationships(promotion.custom_promotion_rule)
        .map((rule) =>
          !rule.rel
            ? rule
            : {
                ...rule,
                rawValues: rule.rawValues.map((id) => {
                  const testRel = testRelationshipsById[id];
                  const compareValue = testRel[compareField[rule.rel!]];
                  const prodRel = prodRelationshipsByCompareField[compareValue];
                  return prodRel.id;
                }),
              }
        )
        .map((rule) => [rule.predicate, rule.rawValues.join(",")])
    );
    log(`Custom promotion rule ${action}...`);
    await clientProd.custom_promotion_rules[action]({
      ...getId(prodPromotion.custom_promotion_rule),
      // @ts-expect-error too flexible for js
      ...pick(promotion.custom_promotion_rule, sharedRuleAttributes),
      filters,
      ...getPromotionRel(action, prodPromotion),
    });
  } else if (prodPromotion.custom_promotion_rule) {
    log(`Custom promotion rule delete...`);
    await clientProd.custom_promotion_rules.delete(
      prodPromotion.custom_promotion_rule.id
    );
  }
};

const sharedPromotionAttributes = [
  "name",
  "currency_code",
  "exclusive",
  "priority",
  "starts_at",
  "expires_at",
  "total_usage_limit",
  ...sharedAttributes,
] as const;

const attributesByPromotionType = {
  buy_x_pay_y_promotions: ["x", "y", "cheapest_free"],
  external_promotions: ["promotion_url"],
  fixed_amount_promotions: ["fixed_amount_cents"],
  fixed_price_promotions: ["fixed_amount_cents"],
  free_gift_promotions: ["max_quantity"],
  free_shipping_promotions: [],
  percentage_discount_promotions: ["percentage"],
} as const;

const getSharedRelationships = (
  promotion: Promotions,
  prodRelationshipsByCompareField: Record<string, any>
) =>
  (
    [
      { field: "market", type: "markets" },
      { field: "sku_list", type: "sku_lists" },
    ] as const
  ).reduce((relationships, { field, type }) => {
    // @ts-expect-error too flexible for js
    const testRef = promotion[field]?.[compareField[type]];
    const prodRes = testRef && prodRelationshipsByCompareField[testRef];
    return prodRes
      ? {
          ...relationships,
          [field]: {
            type,
            id: prodRes.id,
          },
        }
      : relationships;
  }, {});

const createPromotion = async (
  clientProd: CommerceLayerClient,
  promotion: Promotions,
  prodPromotion: Promotions | undefined,
  testRelationshipsById: Record<string, any>,
  prodRelationshipsByCompareField: Record<string, any>,
  log: (...args: any[]) => void
) => {
  log(`Promotion ${promotion.name}`);
  const action = getAction(prodPromotion);
  log(`Promotion ${action}...`);
  prodPromotion = await clientProd[promotion.type][action](
    {
      ...getId(prodPromotion),
      // @ts-expect-error too flexible for js
      ...pick(promotion, sharedPromotionAttributes),
      _disable: true,
      // @ts-expect-error too flexible for js
      ...pick(promotion, attributesByPromotionType[promotion.type]),
      ...getSharedRelationships(promotion, prodRelationshipsByCompareField),
    },
    query
  );

  await createRules(
    clientProd,
    promotion,
    prodPromotion,
    testRelationshipsById,
    prodRelationshipsByCompareField,
    log
  );

  if (promotion.active) {
    log(`Enabling...`);
    await clientProd[prodPromotion.type].update({
      id: prodPromotion.id,
      _enable: true,
    });
  }
};
