/* eslint-disable prettier/prettier */
/* eslint-disable @typescript-eslint/strict-boolean-expressions */
/* eslint-disable @typescript-eslint/explicit-function-return-type */
import { Export } from "#components/Export";
import { Import } from "#components/Import";
import { compareField } from '#data/shared';
import {
Hint,
PageLayout,
Spacer,
Tab,
TableData,
Tabs,
useTokenProvider
} from "@commercelayer/app-elements";

function SyncHomePage(): JSX.Element {
  const {
    settings: { mode },
  } = useTokenProvider();
  const compareTableData = Object.entries(compareField).map(([resource, compareField]) => ({ resource, 'compare field': compareField }))

  return (
    <PageLayout title="Sync Promotions" mode={mode}>
      <p>These are the fields used to identify and compare test/live resources.</p>
      <Spacer bottom="4" />
      <TableData data={compareTableData} />
      <Spacer bottom="8" />
      <Hint icon="info">
        While creating a coupons promotion, an expired "placeholder" coupon will be created to not apply the promotion to all orders
      </Hint>
      <Spacer bottom="12" />
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
