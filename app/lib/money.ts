function englishFormatMoney(amountstr: string): string {
  let formatted = "";

  const pointDex = amountstr.indexOf(".");
  if (pointDex > 0) {
    let cents = amountstr.substring(pointDex);
    const dolars = amountstr.substring(0, pointDex);
    cents = cents.padEnd(3, "0");
    formatted = dolars + cents;
  } else {
    formatted = amountstr + ".00";
  }
  return formatted.substring(2);
}

function frenchFormatMoney(amountstr: string): string {
  return amountstr.slice(0, -2);
}

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
    const formattedFirst = formatter.format(amount);
    if (locale.startsWith("en")) {
      formattedAmount = englishFormatMoney(formattedFirst);
    } else if (locale.startsWith("fr")) {
      formattedAmount = frenchFormatMoney(formattedFirst);
    } else {
      formattedAmount = formattedFirst;
    }
  } catch (err) {
    console.error("Money formatting error:", err);
    return `${amount} ${currency}`;
  }
  return formattedAmount;
}
