export async function formatMoney(
  amount: number,
  locale: string,
  currency: string = "CAD",
): Promise<string> {
  let formattedAmount: string = "";
  try {
    const formatter = new Intl.NumberFormat(locale, {
      style: "currency",
      currency,
    });
    formattedAmount = formatter.format(amount).substring(2);
    const pointDex = formattedAmount.indexOf(".");
    if (pointDex > 0) {
      let cents = formattedAmount.substring(pointDex);
      const dolars = formattedAmount.substring(0, pointDex);
      cents = cents.padEnd(3, "0");
      formattedAmount = dolars + cents;
    } else {
      formattedAmount += ".00";
    }
    return formattedAmount;
  } catch (err) {
    console.error("Money formatting error:", err);
    return `${amount} ${currency}`;
  }
}
