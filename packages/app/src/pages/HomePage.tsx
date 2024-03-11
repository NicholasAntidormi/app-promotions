import { filtersInstructions, predicateWhitelist } from '#data/filters'
import { presets } from '#data/lists'
import { appRoutes } from '#data/routes'
import {
  HomePageLayout,
  Icon,
  List,
  ListItem,
  RadialProgress,
  Spacer,
  StatusIcon,
  Text,
  useResourceFilters,
  useTokenProvider
} from '@commercelayer/app-elements'
import { Link, useLocation, useSearch } from 'wouter'

function HomePage(): JSX.Element {
  const { canUser } = useTokenProvider()

  const search = useSearch()
  const [, setLocation] = useLocation()

  const { SearchWithNav, adapters } = useResourceFilters({
    instructions: filtersInstructions,
    predicateWhitelist
  })

  return (
    <HomePageLayout title='Promotions'>
      <SearchWithNav
        hideFiltersNav
        onFilterClick={() => {}}
        onUpdate={(qs) => {
          setLocation(appRoutes.promotionList.makePath({}, qs))
        }}
        queryString={search}
      />

      <Spacer top='14'>
        <List
          title='Browse'
          actionButton={
            canUser('create', 'buy_x_pay_y_promotions') ||
            canUser('create', 'external_promotions') ||
            canUser('create', 'fixed_amount_promotions') ||
            canUser('create', 'fixed_price_promotions') ||
            canUser('create', 'free_gift_promotions') ||
            canUser('create', 'free_shipping_promotions') ||
            canUser('create', 'percentage_discount_promotions') ? (
              <Link asChild href={appRoutes.newSelectType.makePath({})}>
                <a>Add promo</a>
              </Link>
            ) : undefined
          }
        >
          <Link
            href={appRoutes.promotionList.makePath(
              {},
              adapters.adaptFormValuesToUrlQuery({
                formValues: presets.active
              })
            )}
            asChild
          >
            <ListItem
              tag='a'
              icon={<StatusIcon name='pulse' background='green' gap='small' />}
            >
              <Text weight='semibold'>{presets.active.viewTitle} </Text>
              <StatusIcon name='caretRight' />
            </ListItem>
          </Link>

          <Link
            href={appRoutes.promotionList.makePath(
              {},
              adapters.adaptFormValuesToUrlQuery({
                formValues: presets.upcoming
              })
            )}
            asChild
          >
            <ListItem tag='a' icon={<RadialProgress size='small' />}>
              <Text weight='semibold'>{presets.upcoming.viewTitle} </Text>
              <StatusIcon name='caretRight' />
            </ListItem>
          </Link>

          <Link
            href={appRoutes.promotionList.makePath(
              {},
              adapters.adaptFormValuesToUrlQuery({
                formValues: presets.disabled
              })
            )}
            asChild
          >
            <ListItem
              tag='a'
              icon={
                <StatusIcon name='minus' background='lightGray' gap='small' />
              }
            >
              <Text weight='semibold'>{presets.disabled.viewTitle} </Text>
              <StatusIcon name='caretRight' />
            </ListItem>
          </Link>

          <Link asChild href={appRoutes.promotionList.makePath({})}>
            <ListItem
              tag='a'
              icon={
                <StatusIcon
                  name='asteriskSimple'
                  background='black'
                  gap='small'
                />
              }
            >
              <Text weight='semibold'>All promotions</Text>
              <Icon name='caretRight' />
            </ListItem>
          </Link>
        </List>
      </Spacer>
    </HomePageLayout>
  )
}

export default HomePage
