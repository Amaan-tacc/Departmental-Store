// utils/generateBarcode.js
export const generateBarcode = () => {
  // Generate a 12-digit barcode (EAN-13 format without check digit)
  const baseBarcode = Math.floor(100000000000 + Math.random() * 900000000000).toString();
  
  // Calculate EAN-13 check digit
  let sum = 0;
  for (let i = 0; i < 12; i++) {
    const digit = parseInt(baseBarcode[i]);
    sum += i % 2 === 0 ? digit : digit * 3;
  }
  const checkDigit = (10 - (sum % 10)) % 10;
  
  return baseBarcode + checkDigit;
};

export const validateBarcode = (barcode) => {
  if (barcode.length !== 13) return false;
  
  let sum = 0;
  for (let i = 0; i < 12; i++) {
    const digit = parseInt(barcode[i]);
    sum += i % 2 === 0 ? digit : digit * 3;
  }
  const checkDigit = (10 - (sum % 10)) % 10;
  
  return checkDigit === parseInt(barcode[12]);
};