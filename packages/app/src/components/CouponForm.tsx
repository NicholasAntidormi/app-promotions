import { couponForm, formValuesToCoupon } from '#data/dictionaries/coupon'
import { appRoutes } from '#data/routes'
import { useCoupon } from '#hooks/useCoupon'
import { usePromotion } from '#hooks/usePromotion'
import {
  Button,
  HookedForm,
  HookedInput,
  HookedInputCheckbox,
  HookedInputDate,
  Spacer,
  useCoreSdkProvider
} from '@commercelayer/app-elements'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { useLocation } from 'wouter'
import { type z } from 'zod'

interface Props {
  promotionId: string
  couponId?: string
  defaultValues?: Partial<z.infer<typeof couponForm>>
}

export function CouponForm({
  promotionId,
  couponId,
  defaultValues
}: Props): JSX.Element {
  const [, setLocation] = useLocation()
  const { promotion } = usePromotion(promotionId)
  const { mutateCoupon } = useCoupon(couponId)
  const methods = useForm<z.infer<typeof couponForm>>({
    defaultValues,
    resolver: zodResolver(couponForm),
    mode: 'onTouched'
  })

  const { sdkClient } = useCoreSdkProvider()

  return (
    <HookedForm
      {...methods}
      onSubmit={async (values): Promise<void> => {
        if (couponId != null) {
          await sdkClient.coupons.update({
            id: couponId,
            ...formValuesToCoupon(values)
          })
        } else {
          let promotionRule = promotion?.coupon_codes_promotion_rule

          if (promotionRule == null) {
            promotionRule = await sdkClient.coupon_codes_promotion_rules.create(
              {
                promotion
              }
            )
          }

          await sdkClient.coupons.create({
            ...formValuesToCoupon(values),
            promotion_rule: promotionRule
          })
        }

        await mutateCoupon()

        setLocation(
          appRoutes.promotionDetails.makePath({
            promotionId
          })
        )
      }}
    >
      <Spacer top='6'>
        <HookedInput
          name='code'
          maxLength={40}
          label='Coupon code'
          hint={{ text: '8 to 40 characters.' }}
        />
      </Spacer>

      <Spacer top='6'>
        <HookedInputDate
          name='expires_at'
          isClearable
          label='Expires on'
          hint={{
            text: 'Optionally set an expiration date for the coupon.'
          }}
        />
      </Spacer>

      <Spacer top='6'>
        <HookedInputCheckbox
          name='show_usage_limit'
          checkedElement={
            <Spacer bottom='6'>
              <HookedInput
                type='number'
                min={1}
                name='usage_limit'
                hint={{
                  text: 'How many times this coupon can be used.'
                }}
              />
            </Spacer>
          }
        >
          Limit usage
        </HookedInputCheckbox>
      </Spacer>

      <Spacer top='6'>
        <HookedInputCheckbox
          name='show_recipient_email'
          checkedElement={
            <Spacer bottom='6'>
              <HookedInput
                type='text'
                name='recipient_email'
                placeholder='Recipient email'
              />
            </Spacer>
          }
        >
          Assign to a customer
        </HookedInputCheckbox>
      </Spacer>

      <Spacer top='6'>
        <HookedInputCheckbox name='customer_single_use'>
          Single use per customer
        </HookedInputCheckbox>
      </Spacer>

      <Spacer top='14'>
        <Button
          fullWidth
          type='submit'
          disabled={
            methods.formState.isSubmitting || !methods.formState.isValid
          }
        >
          {couponId != null ? 'Edit' : 'Add'} coupon
        </Button>
      </Spacer>
    </HookedForm>
  )
}