import { type CustomPromotionRule } from "@commercelayer/sdk";

// adapted from https://github.dev/commercelayer/app-promotions/blob/main/packages/app/src/data/ruleBuilder/config.tsx
export const matchers = {
  in: "in",
  not_in: "not_in",
  eq: "eq",
  gteq: "gteq",
  gt: "gt",
  end_any: "end_any",
};

// adapted from https://github.dev/commercelayer/app-promotions/blob/main/packages/app/src/data/ruleBuilder/config.tsx
export const customRulesConfig = {
  market_id: {
    rel: "markets",
    relField: "id",
    operators: [matchers.in, matchers.not_in],
  },
  currency_code: {
    rel: null,
    relField: null,
    operators: [matchers.in, matchers.not_in],
  },
  line_items_sku_tags_id: {
    rel: "tags",
    relField: "id",
    operators: [matchers.in, matchers.not_in],
  },
  customer_tags_id: {
    rel: "tags",
    relField: "id",
    operators: [matchers.in, matchers.not_in],
  },
  customer_email: {
    rel: null,
    relField: null,
    operators: [matchers.end_any],
  },
  order_tags_id: {
    rel: "tags",
    relField: "id",
    operators: [matchers.in, matchers.not_in],
  },
  subtotal_amount_cents: {
    rel: null,
    relField: null,
    operators: [matchers.eq, matchers.gteq, matchers.gt],
  },
  total_amount_cents: {
    rel: null,
    relField: null,
    operators: [matchers.eq, matchers.gteq, matchers.gt],
  },
} as const;

// adapted from https://github.dev/commercelayer/app-promotions/blob/main/packages/app/src/data/ruleBuilder/usePromotionRules.tsx
export const getCustomPromotionRelationships = (
  promotionRule?: CustomPromotionRule | null | undefined
) =>
  Object.entries(promotionRule?.filters ?? {}).map(([predicate, value]) => {
    const matcherRegex = new RegExp(
      `(?<matcher>${Object.keys(matchers)
        .map((matcher) => `_${matcher}`)
        .join("|")})`
    );

    const matcher = predicate
      .match(matcherRegex)
      ?.groups?.matcher?.replace("_", "") as keyof typeof matchers | undefined;

    const attributes = predicate.replace(matcherRegex, "");

    const config =
      customRulesConfig[attributes as keyof typeof customRulesConfig];

    if (!config == null) throw new Error("predicate not supported");

    return {
      predicate,
      attributes,
      matcher,
      value,
      rawValues: String(value).toString().split(","),
      rel: config.rel,
      relField: config.relField,
    };
  });
