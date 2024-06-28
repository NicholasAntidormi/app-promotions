/* eslint-disable prettier/prettier */
/* eslint-disable @typescript-eslint/strict-boolean-expressions */
/* eslint-disable @typescript-eslint/explicit-function-return-type */
import { InputParser } from '#components/InputParser'
import { exportPromotions } from '#data/exportPromotions'
import { importPromotions } from '#data/importPromotions'
import {
Button,
InputFeedback,
PageLayout,
Spacer,
useCoreSdkProvider,
useTokenProvider
} from '@commercelayer/app-elements'
import { CommerceLayerStatic } from '@commercelayer/sdk'
import { useState } from 'react'

function SyncHomePage(): JSX.Element {
  const {
    settings: { mode }
  } = useTokenProvider()
  const { sdkClient } = useCoreSdkProvider()

  const [isExporting, setIsExporting] = useState(false)
  const [exportError, setExportError] = useState<string | null>(null)
  const [exportLogs, setExportLogs] = useState<string[]>([])

  const exportPromotionsApp = async () => {
    if (isExporting) {
      return
    }
    setExportError(null)
    setIsExporting(true)
    try {
      const json = await exportPromotions(
        sdkClient,
        (...v: any[]) => {
          console.log(v)
          setExportLogs(
            (exportLogs) =>
              exportLogs
                .concat(
                  v.map((v) => typeof v === 'object' ? JSON.stringify(v) : `${v}`).join(' ')
                )
          )
        }
      )
      const data = JSON.stringify(json);
      const blob = new Blob([data], { type: "application/json" });
      const jsonObjectUrl = URL.createObjectURL(blob);
      const filename = 'promotions' + Date.now() + ".json";
      const anchorEl = document.createElement("a");
      anchorEl.href = jsonObjectUrl;
      anchorEl.download = filename;
      anchorEl.click();
      URL.revokeObjectURL(jsonObjectUrl);
    } catch (e) {
      console.log(e)
      const errorMessage = CommerceLayerStatic.isApiError(e)
        ? e.errors.map(({ detail }) => detail).join(', ')
        : 'Could not export'
      setExportError(errorMessage)
    } finally {
      setIsExporting(false)
    }
  }

  const [importValue, setImportValue] = useState<any | null>(null)
  const [isImporting, setIsImporting] = useState(false)
  const [importError, setImportError] = useState<string | null>(null)
  const [importLogs, setImportLogs] = useState<string[]>([])

  const importPromotionsApp = async () => {
    if (!importValue || isImporting) {
      return
    }
    setImportError(null)
    setIsImporting(true)
    try {
      await importPromotions(
        sdkClient,
        importValue.promotions,
        importValue.relationshipsById,
        importValue.relationshipsTypes,
        (...v: any[]) => {
          console.log(v)
          setImportLogs(
            (importLogs) =>
              importLogs
                .concat(
                  v.map((v) => typeof v === 'object' ? JSON.stringify(v) : `${v}`).join(' ')
                )
          )
        }
      )
    } catch (e) {
      console.log(e)
      const errorMessage = CommerceLayerStatic.isApiError(e)
        ? e.errors.map(({ detail }) => detail).join(', ')
        : 'Could not import'
      setImportError(errorMessage)
    } finally {
      setIsImporting(false)
    }
  }

  return (
    <PageLayout title='Sync Promotions' mode={mode}>
      <Spacer bottom='14'>
        <Button
          variant='primary'
          onClick={() => {
            void exportPromotionsApp()
          }}
          disabled={isExporting}
        >
          {isExporting ? 'Exporting...' : `Export`}
        </Button>
        {exportError && (
          <InputFeedback variant='danger' message={exportError} />
        )}
        <div style={{maxHeight: '300px', overflow: 'auto', margin: '20px 0'}}>{(exportLogs.map((exportLog, i) => <div key={exportLog + i}>{exportLog}</div>))}</div>
      </Spacer>

      <Spacer bottom='14'>
        <InputParser
          onDataReady={setImportValue}
          onDataResetRequest={() => {
            setImportValue(undefined)
          }}
        />
      </Spacer>

      <Spacer bottom='14'>
        <Button
          variant='primary'
          onClick={() => {
            void importPromotionsApp()
          }}
          disabled={isImporting}
        >
          {isImporting ? 'Importing...' : `Import`}
        </Button>
        {importError && (
          <InputFeedback variant='danger' message={importError} />
        )}
        <div style={{maxHeight: '300px', overflow: 'auto', margin: '20px 0'}}>{(importLogs.map((importLog, i) => <div key={importLog + i}>{importLog}</div>))}</div>
      </Spacer>
    </PageLayout>
  )
}

export default SyncHomePage
