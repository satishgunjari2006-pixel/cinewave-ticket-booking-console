import React from 'react';
import { FOOD_BEVERAGE_MENU } from '../../data/types';
import { formatINR, calculateTotalCost } from '../../utils/costCalculator';

export function FoodBeverageSelector({
  show,
  selectedSeats,
  seatCategory,
  foodItems,
  setFoodItems,
  onProceed,
  onBack,
}) {
  const getItemQty = (itemId) => {
    const found = foodItems.find(f => f.id === itemId);
    return found ? found.quantity : 0;
  };

  const updateItemQty = (itemId, delta) => {
    const current = getItemQty(itemId);
    const newQty = Math.max(0, current + delta);

    if (newQty === 0) {
      setFoodItems(foodItems.filter(f => f.id !== itemId));
    } else {
      const exists = foodItems.some(f => f.id === itemId);
      if (exists) {
        setFoodItems(foodItems.map(f => f.id === itemId ? { ...f, quantity: newQty } : f));
      } else {
        setFoodItems([...foodItems, { id: itemId, quantity: newQty }]);
      }
    }
  };

  const costCalc = calculateTotalCost(show, selectedSeats.length, seatCategory, foodItems);

  return (
    <div className="fnb-container">
      <div className="fnb-header-bar">
        <button type="button" className="btn-back-link" onClick={onBack}>
          ← Back to Seat Selection
        </button>
        <div>
          <h2 className="fnb-title">Grab a Bite! Add Food & Beverages</h2>
          <p className="fnb-sub">Pre-book your favorite cinema snacks & combos to skip interval concession queues.</p>
        </div>
      </div>

      {/* Menu Grid */}
      <div className="fnb-grid">
        {FOOD_BEVERAGE_MENU.map(item => {
          const qty = getItemQty(item.id);

          return (
            <div key={item.id} className={`fnb-card ${qty > 0 ? 'fnb-card-active' : ''}`}>
              <div className="fnb-img-wrapper">
                <img src={item.imageUrl} alt={item.name} className="fnb-img" loading="lazy" />
                {item.tag && <span className="fnb-tag-badge">{item.tag}</span>}
              </div>

              <div className="fnb-card-body">
                <div className="fnb-category-label">{item.category} • {item.calories}</div>
                <h4 className="fnb-item-name">{item.name}</h4>
                <div className="fnb-portion">{item.portion}</div>

                <div className="fnb-card-footer">
                  <span className="fnb-item-price">{formatINR(item.price, false)}</span>

                  {qty === 0 ? (
                    <button
                      type="button"
                      className="btn-fnb-add"
                      onClick={() => updateItemQty(item.id, 1)}
                    >
                      + ADD
                    </button>
                  ) : (
                    <div className="fnb-stepper">
                      <button
                        type="button"
                        className="btn-step"
                        onClick={() => updateItemQty(item.id, -1)}
                      >
                        −
                      </button>
                      <span className="step-qty">{qty}</span>
                      <button
                        type="button"
                        className="btn-step"
                        onClick={() => updateItemQty(item.id, 1)}
                      >
                        +
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Sticky Bottom Bar with F&B updates */}
      <div className="sticky-checkout-bar">
        <div className="checkout-bar-inner">
          <div className="selection-details">
            <div className="selected-seats-badge">
              <span className="count-pill">{selectedSeats.length} Seats</span>
              <span className="seats-text">{selectedSeats.join(', ')}</span>
              {costCalc.foodItemsBreakdown.length > 0 && (
                <span className="tier-tag">🍿 +{costCalc.foodItemsBreakdown.reduce((sum, f) => sum + f.quantity, 0)} Snack(s)</span>
              )}
            </div>

            <div className="price-breakdown-sub">
              Tickets: {costCalc.formattedTicketSubtotal} + F&B: {costCalc.formattedFoodSubtotal} + Taxes: {formatINR(costCalc.ticketServiceFee + costCalc.foodGst)}
            </div>
          </div>

          <div className="checkout-action-wrap">
            <div className="total-price-box">
              <span className="total-label">Grand Total (INR)</span>
              <span className="total-amount">{costCalc.formattedTotal}</span>
            </div>

            <button
              type="button"
              className="btn-bms-proceed"
              onClick={onProceed}
            >
              {foodItems.length > 0 ? 'Proceed to Guest Details →' : 'Skip & Continue to Guest Details →'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
