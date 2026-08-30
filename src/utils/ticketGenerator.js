import { formatINR } from './costCalculator';

/**
 * Generates a unique Cinema Booking Reference ID.
 * Format: CW-TKT-XXXXXX
 */
export function generateTicketReference() {
  const random = Math.floor(100000 + Math.random() * 900000);
  return `CW-TKT-${random}`;
}

/**
 * Generates a simulated confirmation email correspondence record in INR.
 * Accepts positional args (caseItem, show, movie) or options object ({ caseItem, show, movie, ticketRef, confirmedAt }).
 */
export function createConfirmationCorrespondence(caseItemOrOptions, maybeShow, maybeMovie) {
  let caseItem = caseItemOrOptions;
  let show = maybeShow;
  let movie = maybeMovie;

  // Defensive fallback if called with single options object { caseItem, show, movie, ticketRef, confirmedAt }
  if (caseItemOrOptions && caseItemOrOptions.caseItem && !maybeShow) {
    caseItem = caseItemOrOptions.caseItem;
    show = caseItemOrOptions.show;
    movie = caseItemOrOptions.movie;
    if (caseItemOrOptions.ticketRef && !caseItem.bookingReference) {
      caseItem = { ...caseItem, bookingReference: caseItemOrOptions.ticketRef };
    }
  }

  const ticketRef = caseItem?.bookingReference || generateTicketReference();
  const seatsList = Array.isArray(caseItem?.selectedSeats) && caseItem.selectedSeats.length > 0
    ? caseItem.selectedSeats.join(', ')
    : `${caseItem?.seatCount || 1} seat(s) (${caseItem?.seatCategory || 'STANDARD'})`;

  const subject = `Confirmed: Your CineWave Booking Reference ${ticketRef} for ${movie?.title || 'Your Show'}`;
  const locationStr = show?.city && show?.state ? `${show.theatre}, ${show.city}, ${show.state}` : (show?.theatre || 'Main Cinema');
  const formattedTotal = formatINR(caseItem?.totalCost || 0);

  const bodyText = `
DEAR ${caseItem?.customerName?.toUpperCase() || 'VALUED GUEST'},

YOUR CINEMA BOOKING HAS BEEN FORMALLY CONFIRMED AND RESERVED.

==================================================
              CINEWAVE BOX OFFICE DISPATCH
==================================================
TICKET REF   : ${ticketRef}
CASE ID      : ${caseItem?.caseId || 'N/A'}
MOVIE        : ${movie?.title || 'N/A'} (${movie?.certificate || 'UA 13+'}, ${movie?.language || 'English'})
LOCATION     : ${locationStr}
SCREEN       : ${show?.screen || 'Screen 1'} (${show?.showType || show?.format || 'Standard'})
DATE & TIME  : ${show?.date || 'Today'}, ${show?.time || 'Showtime'}
SEATS        : ${seatsList}
CATEGORY     : ${caseItem?.seatCategory || 'Standard'}
TOTAL PAID   : ${formattedTotal}
STATUS       : CONFIRMED / SEATS RESERVED
==================================================

ENTRY INSTRUCTIONS:
Present this digital confirmation or reference ${ticketRef} at the box office scanner or kiosk.
Doors open 15 minutes prior to showtime.

Correspondence ID: CORR-${Date.now().toString().slice(-6)}
Timestamp: ${new Date().toISOString()}
Dispatched by CineWave Automation Case Worker (Stage 4 Execution Engine)
  `.trim();

  return {
    id: `CORR-${Date.now().toString().slice(-6)}`,
    recipient: caseItem?.customerEmail || 'customer@example.in',
    recipientName: caseItem?.customerName || 'Valued Guest',
    recipientPhone: caseItem?.customerPhone || '+91 98000 00000',
    subject,
    body: bodyText,
    type: 'EMAIL_CONFIRMATION',
    timestamp: new Date().toISOString(),
    deliveryStatus: 'Delivered (Simulated Dispatch)',
    ticketRef,
  };
}
