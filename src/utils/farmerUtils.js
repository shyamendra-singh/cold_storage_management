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

const extractFarmerSequence = (farmer = {}) => {
  const name = typeof farmer.name === 'string' ? farmer.name.trim() : '';
  const match = name.match(/^(\d+)/);

  if (!match) {
    return Number.NEGATIVE_INFINITY;
  }

  return Number.parseInt(match[1], 10);
};

const compareFarmerNames = (firstFarmer = {}, secondFarmer = {}) => {
  const firstName = (firstFarmer.name || '').trim().toLowerCase();
  const secondName = (secondFarmer.name || '').trim().toLowerCase();

  return firstName.localeCompare(secondName, undefined, { numeric: true, sensitivity: 'base' });
};

export const sortFarmersBySequenceDesc = (farmers = []) => (
  [...farmers].sort((firstFarmer, secondFarmer) => {
    const secondSequence = extractFarmerSequence(secondFarmer);
    const firstSequence = extractFarmerSequence(firstFarmer);

    if (secondSequence !== firstSequence) {
      return secondSequence - firstSequence;
    }

    return compareFarmerNames(firstFarmer, secondFarmer);
  })
);

export const sortFarmersBySequenceAsc = (farmers = []) => (
  [...farmers].sort((firstFarmer, secondFarmer) => {
    const firstSequence = extractFarmerSequence(firstFarmer);
    const secondSequence = extractFarmerSequence(secondFarmer);

    if (firstSequence !== secondSequence) {
      return firstSequence - secondSequence;
    }

    return compareFarmerNames(firstFarmer, secondFarmer);
  })
);
