/* eslint-disable prettier/prettier */
/* eslint-disable @typescript-eslint/strict-boolean-expressions */
/* eslint-disable @typescript-eslint/explicit-function-return-type */
import { InputParser } from "#components/InputParser";
import {
importPromotions,
prepareImportPromotions,
} from "#data/importPromotions";
import { compareField } from "#data/shared";
import {
Badge,
Button,
InputCheckboxGroup,
InputFeedback,
ResourceListItem,
Spacer,
useCoreSdkProvider
} from "@commercelayer/app-elements";
import { CommerceLayerStatic } from "@commercelayer/sdk";
import { useState } from "react";

export function Import(): JSX.Element {
  const { sdkClient } = useCoreSdkProvider();

  // Import
  const [importValue, setImportValue] = useState<any | null>(null);
  const [importData, setImportData] = useState<any | null>(null);
  const [isPreparingImport, setIsPreparingImport] = useState(false);
  const [prepareImportError, setPrepareImportError] = useState<string | null>(
    null
  );
  const [prepareImportLogs, setPrepareImportLogs] = useState<string[]>([]);

  const prepareImportPromotionsApp = async () => {
    if (!importValue || isPreparingImport) {
      return;
    }
    setPrepareImportError(null);
    setIsPreparingImport(true);
    try {
      const importData = await prepareImportPromotions(
        sdkClient,
        importValue.promotions,
        importValue.relationshipsById,
        importValue.relationshipsTypes,
        (...v: any[]) => {
          console.log(v);
          setPrepareImportLogs((prepareImportLogs) =>
            prepareImportLogs.concat(
              v
                .map((v) =>
                  typeof v === "object" ? JSON.stringify(v) : `${v}`
                )
                .join(" ")
            )
          );
        }
      );
      setImportData(importData);
    } catch (e) {
      console.log(e);
      const errorMessage = CommerceLayerStatic.isApiError(e)
        ? e.errors.map(({ detail }) => detail).join(", ")
        : "Could not import";
      setPrepareImportError(errorMessage);
    } finally {
      setIsPreparingImport(false);
    }
  };

  const [selectedImportValue, setSelectedImportValue] = useState<any | null>(
    null
  );
  const [isImporting, setIsImporting] = useState(false);
  const [importError, setImportError] = useState<string | null>(null);
  const [importLogs, setImportLogs] = useState<string[]>([]);

  const isCreate = (allPromotions: any, promotion: any) => !allPromotions.some(
      (prodPromotion: any) =>
        prodPromotion[compareField.promotions] ===
        promotion[compareField.promotions]
    );

  const importPromotionsApp = async () => {
    if (!importValue || isImporting) {
      return;
    }
    setImportError(null);
    setIsImporting(true);
    try {
      const promotionsToSync = importData.promotionsToSync.filter((promotion: any) =>
        selectedImportValue.some((selected: any) => selected.value === promotion.id)
      );
      await importPromotions(
        sdkClient,
        promotionsToSync,
        importData.allPromotions,
        importData.relationshipsByIdTest,
        importData.relationshipsByCompareField,
        (...v: any[]) => {
          console.log(v);
          setImportLogs((importLogs) =>
            importLogs.concat(
              v
                .map((v) =>
                  typeof v === "object" ? JSON.stringify(v) : `${v}`
                )
                .join(" ")
            )
          );
        }
      );
    } catch (e) {
      console.log(e);
      const errorMessage = CommerceLayerStatic.isApiError(e)
        ? e.errors.map(({ detail }) => detail).join(", ")
        : "Could not import";
      setImportError(errorMessage);
    } finally {
      setIsImporting(false);
    }
  };

  return (
      <Spacer top="14">
        <InputParser
          onDataReady={setImportValue}
          onDataResetRequest={() => {
            setImportValue(undefined);
          }}
        />

        <Spacer top="14">
          <Button
            variant="primary"
            onClick={() => {
              void prepareImportPromotionsApp();
            }}
            disabled={isPreparingImport}
          >
            {isPreparingImport ? "Preparing..." : `Prepare Import`}
          </Button>
          {prepareImportError && (
            <InputFeedback variant="danger" message={prepareImportError} />
          )}
          <div
            style={{ maxHeight: "300px", overflow: "auto", margin: "20px 0" }}
          >
            {prepareImportLogs.map((importLog, i) => (
              <div key={importLog + i}>{importLog}</div>
            ))}
          </div>
        </Spacer>

        {importData && (
          <Spacer top="14" style={{ maxHeight: "500px", overflow: "auto" }}>
            <InputCheckboxGroup
              onChange={setSelectedImportValue}
              options={importData.promotionsToSync.toSorted((p1: any, p2: any) => p2.updated_at - p1.updated_at).map((promotion: any) => ({
                content: (<div style={{display: 'flex', alignItems: 'center'}}>
                  <ResourceListItem resource={promotion} />
                  <Badge variant={isCreate(importData.allPromotions, promotion) ? 'success-solid' : 'primary-solid'}>
                    {isCreate(importData.allPromotions, promotion) ? 'create' : 'update'}
                  </Badge>
                </div>),
                value: promotion.id,
              }))}
              title="Promotions"
            />
          </Spacer>
        )}

        {importData && (<Spacer top="14">
          <Button
            variant="primary"
            onClick={() => {
              void importPromotionsApp();
            }}
            disabled={!selectedImportValue?.length}
          >
            Import
          </Button>
        </Spacer>)}
        {importError && (
          <InputFeedback variant="danger" message={importError} />
        )}
        <div style={{ maxHeight: "300px", overflow: "auto", margin: "20px 0" }}>
          {importLogs.map((importLog, i) => (
            <div key={importLog + i}>{importLog}</div>
          ))}
        </div>
      </Spacer>
  );
}
