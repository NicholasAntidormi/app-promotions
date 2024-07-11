/* eslint-disable prettier/prettier */
/* eslint-disable @typescript-eslint/strict-boolean-expressions */
/* eslint-disable @typescript-eslint/explicit-function-return-type */
import { Export } from "#components/Export";
import { Import } from "#components/Import";
import {
PageLayout,
Tab,
Tabs,
useTokenProvider
} from "@commercelayer/app-elements";

function SyncHomePage(): JSX.Element {
  const {
    settings: { mode },
  } = useTokenProvider();

  return (
    <PageLayout title="Sync Promotions" mode={mode}>
      <Tabs
        keepAlive
      >
        <Tab name="Export">
          <Export />
        </Tab>
        <Tab name="Import">
         <Import />
        </Tab>
      </Tabs>
    </PageLayout>
  );
}

export default SyncHomePage;
