import React, { act } from 'react';
import '@testing-library/jest-dom';
import { renderWithProviders as render, testingLibrary } from '../../../../util/testHelpers';
import EditListingDeliveryForm from './EditListingDeliveryForm';

const { screen, userEvent, within } = testingLibrary;
const noop = () => null;

// Fake listingTypeConfig that has BOTH shipping and pickup enabled
const listingTypeConfig = {
  listingType: 'equipment-rental',
  defaultListingFields: { location: true, payoutDetails: true },
};

describe('EditListingDeliveryForm — IronPeer fee type selector', () => {
  const setup = async () => {
    const user = userEvent.setup();
    render(
      <EditListingDeliveryForm
        dispatch={noop}
        onSubmit={noop}
        saveActionMsg="Save delivery"
        marketplaceCurrency="USD"
        allowOrdersOfMultipleItems={false}
        updated={false}
        updateInProgress={false}
        disabled={false}
        ready={false}
        listingTypeConfig={listingTypeConfig}
      />
    );
    return user;
  };

  it('1. Fee type section is NOT visible before enabling self delivery', async () => {
    const user = await setup();
    expect(screen.queryByText('Flat fee')).not.toBeInTheDocument();
    expect(screen.queryByText('Flat fee + per mile')).not.toBeInTheDocument();
  });

  it('2. Enabling self-delivery shows radius + fee type radio buttons', async () => {
    const user = await setup();
    // Click the Shipping checkbox to enable delivery
    await user.click(screen.getByLabelText(/EditListingDeliveryForm.shippingLabel/i));
    // Click "I'll deliver it myself"
    await user.click(screen.getByLabelText(/I'll deliver it myself/i));
    // Delivery radius field should appear
    expect(screen.getByLabelText(/Delivery radius/i)).toBeInTheDocument();
    // Fee type radios should appear
    expect(screen.getByLabelText('Flat fee')).toBeInTheDocument();
    expect(screen.getByLabelText('Flat fee + per mile')).toBeInTheDocument();
  });

  it('3. Flat fee selected: one Delivery fee input shown, NO per-mile input', async () => {
    const user = await setup();
    await user.click(screen.getByLabelText(/EditListingDeliveryForm.shippingLabel/i));
    await user.click(screen.getByLabelText(/I'll deliver it myself/i));
    // Flat fee is default — click it to be explicit
    await user.click(screen.getByLabelText('Flat fee'));
    // Should have "Delivery fee" input (for flat) — label is "Delivery fee (leave blank if free)"
    expect(screen.getByLabelText(/Delivery fee/i)).toBeInTheDocument();
    // Should NOT have "Rate per mile" input
    expect(screen.queryByLabelText(/Rate per mile/i)).not.toBeInTheDocument();
  });

  it('4. Flat fee + per mile: shows Base delivery fee AND Rate per mile inputs', async () => {
    const user = await setup();
    await user.click(screen.getByLabelText(/EditListingDeliveryForm.shippingLabel/i));
    await user.click(screen.getByLabelText(/I'll deliver it myself/i));
    await user.click(screen.getByLabelText('Flat fee + per mile'));
    // "Base delivery fee" label
    expect(screen.getByLabelText(/Base delivery fee/i)).toBeInTheDocument();
    // "Rate per mile" label
    expect(screen.getByLabelText(/Rate per mile/i)).toBeInTheDocument();
  });

  it('5. Delivery radius field is above (comes before) fee type selector', async () => {
    const user = await setup();
    await user.click(screen.getByLabelText(/EditListingDeliveryForm.shippingLabel/i));
    await user.click(screen.getByLabelText(/I'll deliver it myself/i));
    const radiusInput = screen.getByLabelText(/Delivery radius/i);
    const flatFeeRadio = screen.getByLabelText('Flat fee');
    // The radius input should come before the flat fee radio in DOM order
    const pos = radiusInput.compareDocumentPosition(flatFeeRadio);
    expect(pos & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  });
});
