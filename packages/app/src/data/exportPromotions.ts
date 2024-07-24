/* eslint-disable @typescript-eslint/no-unsafe-argument */
/* eslint-disable @typescript-eslint/explicit-function-return-type */
/* eslint-disable @typescript-eslint/no-non-null-assertion */
/* eslint-disable @typescript-eslint/strict-boolean-expressions */
/* eslint-disable prettier/prettier */
import { unique } from "#data/array";
import { getCustomPromotionRelationships } from "#data/customPromotions";
import { type Promotions } from "#data/promotions";
import { mapValues } from "#data/record";
import { type CommerceLayerClient } from "@commercelayer/sdk";
import { CommerceLayerUtils, retrieveAll } from "@commercelayer/sdk-utils";
// @ts-expect-error not found types
import type { ListableResourceType } from "@commercelayer/sdk/lib/cjs/api";
import defu from "defu";
import {
  areRelationshipsComparable,
  groupById,
  indexByCompareField,
  isComparable,
  query,
} from "./shared";

export const exportPromotions = async (
  cl: CommerceLayerClient,
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

  // Fetch custom rule entities (without refetching already fetched ones).
  const promoRelationshipsByIdList = allPromotions.map(
    getPromoRelationshipsById
  );
  const alreadyFetchedRelationshipsById = defu(
    promoRelationshipsByIdList[0],
    ...promoRelationshipsByIdList.slice(1)
  );
  log(
    "Already fetched relationships:",
    Object.keys(alreadyFetchedRelationshipsById).length
  );
  log(Object.keys(alreadyFetchedRelationshipsById).join(", "));

  log("Retrieving remaining promotions relationships...");
  const relationshipsById = await getRelationships(
    alreadyFetchedRelationshipsById,
    comparablePromotions,
    log
  );

  const relationshipsByCompareField = indexByCompareField(
    // @ts-expect-error why is partial???
    Object.values(relationshipsById)
  );
  log(`Relationships:`, Object.keys(relationshipsById).length);
  log(Object.keys(relationshipsById).join(", "));
  log(Object.keys(relationshipsByCompareField).join(", "));

  const relationshipsTypes = unique(
    Object.values(relationshipsById).map((item) => item!.type)
  );

  // Discard promotions that do not have relationships with necessary fields for identity.
  // @ts-expect-error not found types
  const promotions = comparablePromotions.filter((promotion) =>
    areRelationshipsComparable(relationshipsById, promotion, log)
  );
  log("Syncable promotions:", promotions.length);

  return {
    promotions,
    relationshipsById,
    relationshipsTypes,
  };
};

const getRelationships = async (
  alreadyFetchedRelationships: ReturnType<typeof getPromoRelationshipsById>,
  promotions: Promotions[],
  log: (...args: any[]) => void
) => {
  const customPromotionRelationships = promotions.flatMap((promotion) =>
    getCustomPromotionRelationships(promotion.custom_promotion_rule)
  );

  const customPromotionRelationshipsByRel = Object.groupBy(
    customPromotionRelationships.filter((relationship) => !!relationship.rel),
    (item) => item.rel!
  );

  const relIdList = mapValues(
    customPromotionRelationshipsByRel,
    (relationships) =>
      unique(relationships.flatMap((relationship) => relationship.rawValues))
  );

  const relationships = alreadyFetchedRelationships;
  for (const [resourceName, ids] of Object.entries(relIdList)) {
    const filteredIds = ids.filter(
      (id) => !Object.keys(relationships).includes(id)
    );
    log(`Fetching ${resourceName}...`);
    const resources = await retrieveAll(resourceName as ListableResourceType, {
      filters: {
        id_in: filteredIds.join(","),
      },
    });
    log(`${resourceName}:`, resources.length);
    Object.assign(relationships, groupById(resources));
  }

  return relationships;
};

const getPromoRelationshipsById = (promotion: Promotions) =>
  groupById([
    promotion.market,
    promotion.sku_list,
    promotion.sku_list_promotion_rule?.sku_list,
  ]);
