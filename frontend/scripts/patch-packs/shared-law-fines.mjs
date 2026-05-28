/** Fine amounts shared across all locales (₹ values). */
export const LAW_FINES = {
  speeding: { first: "₹1,000–2,000", repeat: "₹2,000+", imprisonment: "" },
  dangerous: { first: "₹1,000–5,000", repeat: "₹10,000", imprisonment: "6 months–1 year" },
  dui: { first: "₹10,000", repeat: "₹15,000", imprisonment: "6 months–2 years" },
  seatbelt: { first: "₹1,000", repeat: "₹1,000", imprisonment: "" },
  helmet: { first: "₹1,000 + 3-month licence suspension", repeat: "₹2,000", imprisonment: "" },
  redLight: { first: "₹5,000", repeat: "₹10,000", imprisonment: "" },
  mobile: { first: "₹5,000", repeat: "₹10,000", imprisonment: "" },
  wrongSide: { first: "₹1,000", repeat: "₹2,000", imprisonment: "" },
  overloading: { first: "₹20,000 + ₹2,000 per extra tonne", repeat: "Double fine", imprisonment: "" },
  insurance: { first: "₹2,000 or 3 months imprisonment", repeat: "₹4,000 or 3 months", imprisonment: "3 months" },
  licence: { first: "₹5,000", repeat: "₹10,000", imprisonment: "3 months" },
  racing: { first: "₹5,000", repeat: "₹10,000", imprisonment: "3 months" },
};

export function lawEntries(texts) {
  return Object.fromEntries(
    Object.keys(LAW_FINES).map((key) => [
      key,
      { ...LAW_FINES[key], title: texts[key].title, desc: texts[key].desc },
    ])
  );
}
