/* eslint-disable @typescript-eslint/strict-boolean-expressions */
/* eslint-disable @typescript-eslint/explicit-function-return-type */
import { InputFile, Spacer, Text } from '@commercelayer/app-elements'
import { useEffect, useState, type FC } from 'react'

interface Props {
  hasParentResource?: boolean
  onDataReady: (data?: any) => void
  onDataResetRequest: () => void
}

export const InputParser: FC<Props> = ({ onDataReady, onDataResetRequest }) => {
  const [file, setFile] = useState<File | undefined>(undefined)
  const [isParsing, setIsParsing] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | undefined>(
    undefined
  )

  useEffect(
    function parseFileWhenReady() {
      if (!file) return

      switch (file.type) {
        case 'application/json':
          void loadAndParseJson(file)
          return

        default:
          setErrorMessage('Invalid file format. Only JSON allowed.')
      }
    },
    [file]
  )

  const loadAndParseJson = async (file: File) => {
    setIsParsing(true)
    setErrorMessage(undefined)
    try {
      const json = JSON.parse(await file.text())
      onDataReady(json)
    } catch {
      setErrorMessage('Invalid JSON file')
    } finally {
      setIsParsing(false)
    }
  }

  const resetErrorUi = () => {
    setErrorMessage(undefined)
  }

  useEffect(() => {
    onDataResetRequest()
    resetErrorUi()
  }, [file])

  return (
    <div>
      <Spacer bottom='4'>
        <InputFile
          title='Select a JSON file to upload'
          onChange={(e) => {
            if (e.target.files && !isParsing) {
              setFile(e.target.files[0])
            }
          }}
          disabled={isParsing}
          progress={file ? 100 : 0}
        />
      </Spacer>

      {file && (
        <Text variant='info' size='small'>
          File uploaded:{' '}
          <Text variant='primary' tag='span'>
            {file.name}
          </Text>
        </Text>
      )}
      {errorMessage && (
        <Text variant='danger' size='small'>
          (<Spacer top='2'>{errorMessage}</Spacer>)
        </Text>
      )}
    </div>
  )
}
