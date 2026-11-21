import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Screen, ScreenHeader } from '@/components/Screen';
import { Button } from '@/components/Button';
import { Text } from '@/components/Text';
import { ErrorView, LoadingView } from '@/components/States';
import { useEstimate, useEstateLocations } from '@/hooks/useRealEstate';
import { EstateFields } from '@/features/realestate/EstateFields';
import {
  defaults,
  estimateSchema,
  calculatorSchema,
  type EstateFormValues,
} from '@/features/realestate/schemas';
import { EstimateCard, estateStyles, estimateError } from '@/features/realestate/components';

export default function Estimate() {
  const locations = useEstateLocations();
  const estimate = useEstimate();
  const form = useForm<EstateFormValues>({
    defaultValues: defaults,
    resolver: zodResolver(calculatorSchema),
  });
  const run = form.handleSubmit((values) => {
    const district = locations.data?.cities
      .find((c) => c.slug === values.city)
      ?.districts.find((d) => d.slug === values.district);
    if (!district?.views.includes(values.view))
      return form.setError('view', {
        message: 'Select a view available in this district',
      });
    estimate.mutate(estimateSchema.parse(values));
  });
  return (
    <Screen header={<ScreenHeader title="Estimate price" />} contentStyle={estateStyles.stack}>
      {locations.isLoading ? (
        <LoadingView />
      ) : locations.error ? (
        <ErrorView error={locations.error} onRetry={() => locations.refetch()} />
      ) : (
        locations.data && (
          <>
            <Text>Explore sale and monthly rent estimates in Dakahlia.</Text>
            <EstateFields form={form} locations={locations.data} />
            <Button title="Estimate price" loading={estimate.isPending} onPress={run} />
            {estimate.error && (
              <Text accessibilityRole="alert" color="#b42318">
                {estimateError(estimate.error)}
              </Text>
            )}
            {estimate.data && (
              <EstimateCard
                estimate={estimate.data.estimate}
                rent={estimate.variables?.listingType === 'rent'}
                dataNote={locations.data.dataNote}
              />
            )}
          </>
        )
      )}
    </Screen>
  );
}
