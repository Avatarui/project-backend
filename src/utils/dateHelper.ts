export const convertDateFormat = (dateStr: string): string => {
  const [day, month, year] = dateStr.split("/");
  return `${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`;
};

export const formatBirthdayToString = (birthday: Date | null): string | null => {
  return birthday ? birthday.toISOString().split("T")[0] : null;
};