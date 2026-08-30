import { SEAT_CATEGORIES, FOOD_BEVERAGE_MENU } from '../data/types';

/**
 * Formats a number in standard Indian Rupee notation (e.g. ₹1,250.00 or ₹1250)
 */
export function formatINR(amount, includeDecimals = true) {
  if (isNaN(amount) || amount === null || amount === undefined) return '₹0';
  const num = Number(amount);
  return '₹' + num.toLocaleString('en-IN', {
    minimumFractionDigits: includeDecimals ? 2 : 0,
    maximumFractionDigits: 2,
  });
}

/**
 * Calculates the total cost for a booking case dynamically in INR (₹), including F&B items.
 * Formula:
 *  - Ticket Subtotal = Count * Show Base Price * Category Multiplier
 *  - Ticket Convenience Fee = ₹30 + 18% GST (₹35.40) per ticket
 *  - F&B Subtotal = Sum(F&B Item Price * Quantity)
 *  - F&B GST = 5% on F&B Subtotal
 *  - Total Cost = Ticket Subtotal + Ticket Fee + F&B Subtotal + F&B GST
 */
export function calculateTotalCost(show, seatCount = 1, seatCategoryKey = 'STANDARD', foodItems = []) {
  if (!show) {
    return {
      basePrice: 0,
      multiplier: 1,
      pricePerSeat: 0,
      ticketSubtotal: 0,
      ticketServiceFee: 0,
      foodSubtotal: 0,
      foodGst: 0,
      totalCost: 0,
      currency: '₹',
      formattedTotal: '₹0.00',
      foodItemsBreakdown: [],
    };
  }

  const count = Math.max(1, parseInt(seatCount, 10) || 1);
  const basePrice = show.basePrice || 250;
  const categoryConfig = SEAT_CATEGORIES[seatCategoryKey] || SEAT_CATEGORIES.STANDARD;
  const multiplier = categoryConfig.multiplier || 1.0;

  const pricePerSeat = Math.round(basePrice * multiplier);
  const ticketSubtotal = pricePerSeat * count;
  const ticketServiceFee = Number((35.40 * count).toFixed(2)); // ₹30 + 18% GST per ticket

  // Food & Beverage Calculations
  let foodSubtotal = 0;
  const foodItemsBreakdown = [];

  if (Array.isArray(foodItems)) {
    foodItems.forEach(item => {
      const menuItem = FOOD_BEVERAGE_MENU.find(m => m.id === item.id);
      if (menuItem && item.quantity > 0) {
        const lineCost = menuItem.price * item.quantity;
        foodSubtotal += lineCost;
        foodItemsBreakdown.push({
          id: menuItem.id,
          name: menuItem.name,
          portion: menuItem.portion,
          price: menuItem.price,
          quantity: item.quantity,
          lineCost,
          formattedLineCost: formatINR(lineCost),
        });
      }
    });
  }

  const foodGst = Number((foodSubtotal * 0.05).toFixed(2)); // Standard 5% Restaurant GST in India
  const totalCost = Number((ticketSubtotal + ticketServiceFee + foodSubtotal + foodGst).toFixed(2));

  return {
    basePrice,
    multiplier,
    pricePerSeat,
    ticketSubtotal,
    ticketServiceFee,
    foodSubtotal,
    foodGst,
    totalCost,
    currency: '₹',
    formattedPricePerSeat: formatINR(pricePerSeat, false),
    formattedTicketSubtotal: formatINR(ticketSubtotal),
    formattedTicketServiceFee: formatINR(ticketServiceFee),
    formattedFoodSubtotal: formatINR(foodSubtotal),
    formattedFoodGst: formatINR(foodGst),
    formattedTotal: formatINR(totalCost),
    foodItemsBreakdown,
  };
}

/**
 * Calculates Indian Multiplex Cancellation Refund Amount based on hours remaining until showtime
 * Rules:
 *  - >= 24 hours before showtime: 100% ticket refund (minus nominal ₹50 processing fee)
 *  - 4 to 24 hours before showtime: 75% refund (25% cancellation charge)
 *  - < 4 hours before showtime: 50% refund (50% cancellation charge)
 */
export function calculateRefundAmount(totalCost, hoursRemaining = 24) {
  const cost = Number(totalCost) || 0;
  const hours = typeof hoursRemaining === 'number' && !isNaN(hoursRemaining) ? hoursRemaining : 24;

  let refundPercentage = 100;
  let cancellationFee = 0;
  let policyTierLabel = 'Full Refund (>24h before show)';

  if (hours >= 24) {
    refundPercentage = 100;
    cancellationFee = Math.min(50, cost); // Flat ₹50 nominal processing fee
    policyTierLabel = 'Full Refund (>24h)';
  } else if (hours >= 4) {
    refundPercentage = 75;
    cancellationFee = Number((cost * 0.25).toFixed(2));
    policyTierLabel = 'Partial Refund (4h–24h)';
  } else {
    refundPercentage = 50;
    cancellationFee = Number((cost * 0.50).toFixed(2));
    policyTierLabel = 'Late Cancellation (<4h)';
  }

  const refundAmount = Math.max(0, Number((cost - cancellationFee).toFixed(2)));

  return {
    refundPercentage,
    cancellationFee,
    deductionAmount: cancellationFee,
    refundAmount,
    policyTierLabel,
    formattedCancellationFee: formatINR(cancellationFee),
    formattedDeductionAmount: formatINR(cancellationFee),
    formattedRefundAmount: formatINR(refundAmount),
  };
}
