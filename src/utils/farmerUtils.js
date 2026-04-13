export const getFarmerAddress = (farmer = {}) => {
  const directAddress = typeof farmer.address === 'string' ? farmer.address.trim() : '';
  if (directAddress) {
    return directAddress;
  }

  return [farmer.village, farmer.post]
    .map((value) => (typeof value === 'string' ? value.trim() : ''))
    .filter(Boolean)
    .join(', ');
};

export const normalizeFarmerForForm = (farmer = {}) => ({
  ...farmer,
  address: getFarmerAddress(farmer),
});
