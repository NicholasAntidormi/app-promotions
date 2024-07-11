/* eslint-disable prettier/prettier */
/* eslint-disable @typescript-eslint/strict-boolean-expressions */
/* eslint-disable @typescript-eslint/explicit-function-return-type */
import { exportPromotions } from "#data/exportPromotions";
import {
Button,
InputCheckboxGroup,
InputFeedback,
ResourceListItem,
Spacer,
useCoreSdkProvider,
} from "@commercelayer/app-elements";
import { CommerceLayerStatic } from "@commercelayer/sdk";
import { useState } from "react";

export function Export(): JSX.Element {
  const { sdkClient } = useCoreSdkProvider();

  // Export
  const [isExporting, setIsExporting] = useState(false);
  const [exportData, setExportData] = useState<Awaited<
    ReturnType<typeof exportPromotions>
  > | null>(null);
  const [exportError, setExportError] = useState<string | null>(null);
  const [exportLogs, setExportLogs] = useState<string[]>([]);

  const exportPromotionsApp = async () => {
    if (isExporting) {
      return;
    }
    setExportError(null);
    setIsExporting(true);
    try {
      const data = await exportPromotions(sdkClient, (...v: any[]) => {
        console.log(v);
        setExportLogs((exportLogs) =>
          exportLogs.concat(
            v
              .map((v) => (typeof v === "object" ? JSON.stringify(v) : `${v}`))
              .join(" ")
          )
        );
      });
      setExportData(data);
    } catch (e) {
      console.log(e);
      const errorMessage = CommerceLayerStatic.isApiError(e)
        ? e.errors.map(({ detail }) => detail).join(", ")
        : "Could not export";
      setExportError(errorMessage);
    } finally {
      setIsExporting(false);
    }
  };

  const [selectedPromotions, setSelectedPromotions] = useState<Array<{
    value: string;
  }> | null>(null);
  const [downloadExportError, setDownloadExportError] = useState<string | null>(
    null
  );
  const downloadExport = async () => {
    if (!selectedPromotions || !exportData) {
      return;
    }
    setDownloadExportError(null);
    try {
      const selectedData = {
        ...exportData,
        promotions: exportData.promotions.filter((promotion: any) =>
          selectedPromotions.some(
            (selectedPromotion) => promotion.id === selectedPromotion.value
          )
        ),
      };
      const data = JSON.stringify(selectedData);
      const blob = new Blob([data], { type: "application/json" });
      const jsonObjectUrl = URL.createObjectURL(blob);
      const filename = "promotions_" + Date.now() + ".json";
      const anchorEl = document.createElement("a");
      anchorEl.href = jsonObjectUrl;
      anchorEl.download = filename;
      anchorEl.click();
      URL.revokeObjectURL(jsonObjectUrl);
    } catch (e) {
      console.log(e);
      setDownloadExportError("Could not download");
    }
  };

  return (
      <Spacer bottom="14">
        <Button
          variant="primary"
          onClick={() => {
            void exportPromotionsApp();
          }}
          disabled={isExporting}
        >
          {isExporting ? "Exporting..." : `Export`}
        </Button>
        {exportError && (
          <InputFeedback variant="danger" message={exportError} />
        )}

        {exportLogs.length ? (
          <Spacer top="14">
            <div style={{ maxHeight: "300px", overflow: "auto" }}>
              {exportLogs.map((exportLog, i) => (
                <div key={exportLog + i}>{exportLog}</div>
              ))}
            </div>
          </Spacer>
        ) : null}

        {exportData && (
          <Spacer top="14" style={{ maxHeight: "500px", overflow: "auto" }}>
            <InputCheckboxGroup
              defaultValues={exportData.promotions.map((promotion: any) => ({
                value: promotion.id,
              }))}
              onChange={setSelectedPromotions}
              options={exportData.promotions.map((promotion:any) => ({
                content: <ResourceListItem resource={promotion} />,
                value: promotion.id,
              }))}
              title="Promotions"
            />
          </Spacer>
        )}

        {exportData && (
          <Spacer top="14">
            <Button
              variant="primary"
              onClick={() => {
                void downloadExport();
              }}
            >
              Download
            </Button>
          </Spacer>
        )}
        {downloadExportError && (
          <InputFeedback variant="danger" message={downloadExportError} />
        )}
      </Spacer>
    );
}
