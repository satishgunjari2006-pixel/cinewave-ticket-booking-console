import React, { useState } from 'react';
import { useCaseContext } from '../../context/CaseContext';
import { MovieDiscovery } from './MovieDiscovery';
import { ShowtimeSelector } from './ShowtimeSelector';
import { SeatPicker } from './SeatPicker';
import { FoodBeverageSelector } from './FoodBeverageSelector';
import { PaymentModal } from './PaymentModal';
import { calculateTotalCost, formatINR } from '../../utils/costCalculator';
import { SEAT_CATEGORIES } from '../../data/types';

export function BookingWizard({ onBookingCreated }) {
  const { movies, shows, selectedCity, selectedState, createBookingRequest } = useCaseContext();

  const [step, setStep] = useState(1); // 1: Movie, 2: Show, 3: Seats, 4: F&B, 5: Guest & Checkout
  const [selectedMovieId, setSelectedMovieId] = useState(movies[0]?.id || '');
  const [selectedShowId, setSelectedShowId] = useState(shows[0]?.id || '');
  const [seatCategory, setSeatCategory] = useState('STANDARD');
  const [selectedSeats, setSelectedSeats] = useState(['C6', 'C7']);
  const [foodItems, setFoodItems] = useState([]);

  // Guest details
  const [customerName, setCustomerName] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [showPaymentModal, setShowPaymentModal] = useState(false);

  const selectedMovie = movies.find(m => m.id === selectedMovieId) || movies[0];
  const selectedShow = shows.find(s => s.id === selectedShowId) || shows[0];

  const seatCount = Math.max(1, selectedSeats.length);
  const costCalc = calculateTotalCost(selectedShow, seatCount, seatCategory, foodItems);

  const handleSelectMovie = (mId) => {
    setSelectedMovieId(mId);
    const availShows = shows.filter(s => s.movieId === mId && s.city?.toLowerCase() === selectedCity.toLowerCase());
    if (availShows.length > 0) {
      setSelectedShowId(availShows[0].id);
    } else {
      const anyShows = shows.filter(s => s.movieId === mId);
      if (anyShows.length > 0) setSelectedShowId(anyShows[0].id);
    }
    setStep(2);
  };

  const handleSelectShow = (sId) => {
    setSelectedShowId(sId);
    setStep(3);
  };

  const handleOpenPayment = (e) => {
    e.preventDefault();
    if (!customerName || !customerEmail || !customerPhone) {
      alert('Please fill in all contact details.');
      return;
    }
    if (selectedSeats.length === 0) {
      alert('Please select at least 1 seat.');
      return;
    }
    setShowPaymentModal(true);
  };

  const handlePaymentSuccess = (txnId, paymentMethod) => {
    setShowPaymentModal(false);
    try {
      const newCase = createBookingRequest({
        customerName,
        customerEmail,
        customerPhone,
        showId: selectedShow.id,
        seatCategory,
        seatCount: selectedSeats.length,
        selectedSeats,
        foodItems,
        paymentTxnId: txnId,
        paymentMethod,
      });

      if (onBookingCreated) {
        onBookingCreated(newCase);
      }
    } catch (err) {
      alert(err.message);
    }
  };

  return (
    <div className="bms-wizard-wrapper">
      {/* STEP 1: Movie Showcase */}
      {step === 1 && (
        <MovieDiscovery onSelectMovie={handleSelectMovie} />
      )}

      {/* STEP 2: Showtime & Theater Selector */}
      {step === 2 && (
        <ShowtimeSelector
          movieId={selectedMovieId}
          onSelectShow={handleSelectShow}
          onBack={() => setStep(1)}
        />
      )}

      {/* STEP 3: Auditorium Seat Matrix & POV */}
      {step === 3 && (
        <SeatPicker
          show={selectedShow}
          movie={selectedMovie}
          seatCategory={seatCategory}
          setSeatCategory={setSeatCategory}
          selectedSeats={selectedSeats}
          setSelectedSeats={setSelectedSeats}
          foodItems={foodItems}
          onProceed={() => setStep(4)}
          onBack={() => setStep(2)}
        />
      )}

      {/* STEP 4: Food & Beverage Snack Counter */}
      {step === 4 && (
        <FoodBeverageSelector
          show={selectedShow}
          selectedSeats={selectedSeats}
          seatCategory={seatCategory}
          foodItems={foodItems}
          setFoodItems={setFoodItems}
          onProceed={() => setStep(5)}
          onBack={() => setStep(3)}
        />
      )}

      {/* STEP 5: Guest Contact & Order Summary */}
      {step === 5 && (
        <div className="guest-form-container">
          <div className="form-header-bar">
            <button type="button" className="btn-back-link" onClick={() => setStep(4)}>
              ← Back to F&B Snacks
            </button>
            <h2 className="form-title">Guest Contact Details & Order Summary</h2>
          </div>

          <form onSubmit={handleOpenPayment} className="guest-form-grid">
            {/* Left: Contact Info */}
            <div className="form-fields-card">
              <div className="card-heading">Primary Guest Contact</div>
              <p className="card-sub">Your digital M-ticket confirmation pass will be dispatched to this email & phone.</p>

              <div className="form-group">
                <label className="form-label">Full Name</label>
                <input
                  type="text"
                  placeholder="e.g. Aarav Mehta"
                  required
                  value={customerName}
                  onChange={e => setCustomerName(e.target.value)}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Email Address</label>
                <input
                  type="email"
                  placeholder="e.g. aarav.mehta@mumbai.in"
                  required
                  value={customerEmail}
                  onChange={e => setCustomerEmail(e.target.value)}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Mobile Number</label>
                <input
                  type="tel"
                  placeholder="+91 98201 55443"
                  required
                  value={customerPhone}
                  onChange={e => setCustomerPhone(e.target.value)}
                />
              </div>

              <div className="queue-notice-banner">
                ⚡ <strong>Queue Dispatch:</strong> This booking request will be automatically routed to <strong>{selectedShow?.showType === 'Premium' ? 'Premium ShowQueue' : 'Standard ShowQueue'}</strong> with active 24h SLA monitoring.
              </div>
            </div>

            {/* Right: Order Summary with F&B breakdown */}
            <div className="order-summary-card">
              <div className="card-heading">Booking Breakdown</div>

              <div className="summary-movie-row">
                <img src={selectedMovie?.posterUrl} alt={selectedMovie?.title} className="summary-poster" />
                <div>
                  <h4 className="summary-movie-title">{selectedMovie?.title}</h4>
                  <div className="summary-meta">{selectedMovie?.genre}</div>
                  <div className="badge-cert">{selectedMovie?.certificate}</div>
                </div>
              </div>

              <div className="summary-details-list">
                <div className="summary-row">
                  <span>Multiplex Venue:</span>
                  <span className="summary-val">{selectedShow?.theatre} ({selectedShow?.city}, {selectedShow?.state})</span>
                </div>
                <div className="summary-row">
                  <span>Screen & Showtime:</span>
                  <span className="summary-val">{selectedShow?.screen} • {selectedShow?.date} at <strong>{selectedShow?.time}</strong></span>
                </div>
                <div className="summary-row">
                  <span>Seats:</span>
                  <span className="summary-val">{selectedSeats.join(', ')} ({SEAT_CATEGORIES[seatCategory]?.badge})</span>
                </div>
                <div className="summary-row">
                  <span>Ticket Subtotal:</span>
                  <span className="summary-val">{costCalc.formattedTicketSubtotal}</span>
                </div>
                <div className="summary-row">
                  <span>Convenience Fee & GST (18%):</span>
                  <span className="summary-val">{costCalc.formattedTicketServiceFee}</span>
                </div>

                {costCalc.foodItemsBreakdown.length > 0 && (
                  <>
                    <div className="summary-row" style={{ color: 'var(--amber-500)', fontWeight: '600' }}>
                      <span>🍿 F&B Snacks ({costCalc.foodItemsBreakdown.length} items):</span>
                      <span className="summary-val">{costCalc.formattedFoodSubtotal}</span>
                    </div>
                    <div className="summary-row" style={{ fontSize: '11px' }}>
                      <span>Restaurant GST (5%):</span>
                      <span className="summary-val">{costCalc.formattedFoodGst}</span>
                    </div>
                  </>
                )}

                <div className="summary-row total-highlight-row">
                  <span>TOTAL COST (INR):</span>
                  <span className="total-highlight-val">{costCalc.formattedTotal}</span>
                </div>
              </div>

              <button
                type="submit"
                className="btn-submit-booking"
              >
                Proceed to Payment ({costCalc.formattedTotal}) →
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Payment Gateway Modal */}
      {showPaymentModal && (
        <PaymentModal
          totalCost={costCalc.totalCost}
          customerName={customerName}
          onPaymentSuccess={handlePaymentSuccess}
          onClose={() => setShowPaymentModal(false)}
        />
      )}
    </div>
  );
}
