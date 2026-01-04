export const getCutOffDate = (cutOffDay, baseDate = new Date()) => {
  if (!cutOffDay) return null;

  const year = baseDate.getFullYear();
  const month = baseDate.getMonth(); // current month
  return new Date(year, month, cutOffDay);
};
