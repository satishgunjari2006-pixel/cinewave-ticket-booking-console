import React, { createContext, useContext, useState, useEffect } from 'react';
import { 
  INITIAL_MOVIES, 
  INITIAL_SHOWS, 
  INITIAL_CASES 
} from '../data/initialData';
import { 
  STAGES, 
  STATUSES, 
  QUEUES, 
  SHOW_TYPES, 
  determineShowQueue,
  SEAT_CATEGORIES,
  LOCATIONS,
  SLA_GOAL_HOURS, 
  SLA_DEADLINE_HOURS 
} from '../data/types';
import { calculateTotalCost, calculateRefundAmount } from '../utils/costCalculator';
import { generateTicketReference, createConfirmationCorrespondence } from '../utils/ticketGenerator';
import { calculateSLA, SLA_STATES } from '../utils/slaCalculator';

const CaseContext = createContext();

export const sanitizeEncoding = (val) => {
  if (typeof val === 'string') {
    return val
      .replace(/â€¢/g, '•')
      .replace(/â€”/g, '—')
      .replace(/â€™/g, "'")
      .replace(/â‚¹/g, '₹')
      .replace(/\u00E2\u20AC\u00A2/g, '•')
      .replace(/\u00E2\u20AC\u201D/g, '—')
      .replace(/\u00E2\u20AC\u2122/g, "'")
      .replace(/\u00E2\u201A\u00B9/g, '₹');
  }
  if (Array.isArray(val)) {
    return val.map(sanitizeEncoding);
  }
  if (val && typeof val === 'object') {
    const res = {};
    for (const k of Object.keys(val)) {
      res[k] = sanitizeEncoding(val[k]);
    }
    return res;
  }
  return val;
};

const STORAGE_KEY_MOVIES = 'cinewave_movies_v10';
const STORAGE_KEY_SHOWS = 'cinewave_shows_v10';
const STORAGE_KEY_CASES = 'cinewave_cases_v10';
const STORAGE_KEY_OFFSET = 'cinewave_time_offset_v10';
const STORAGE_KEY_CITY = 'cinewave_city_v10';
const STORAGE_KEY_STATE = 'cinewave_state_v10';

export function CaseProvider({ children }) {
  // 1. Core State
  const [movies, setMovies] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_MOVIES);
      return sanitizeEncoding(saved ? JSON.parse(saved) : INITIAL_MOVIES);
    } catch {
      return sanitizeEncoding(INITIAL_MOVIES);
    }
  });

  const [shows, setShows] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_SHOWS);
      return sanitizeEncoding(saved ? JSON.parse(saved) : INITIAL_SHOWS);
    } catch {
      return sanitizeEncoding(INITIAL_SHOWS);
    }
  });

  const [cases, setCases] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_CASES);
      return sanitizeEncoding(saved ? JSON.parse(saved) : INITIAL_CASES);
    } catch {
      return sanitizeEncoding(INITIAL_CASES);
    }
  });

  // Selected Location (Default: Hyderabad, Telangana)
  const [selectedState, setSelectedState] = useState(() => {
    return localStorage.getItem(STORAGE_KEY_STATE) || 'Telangana';
  });
  const [selectedCity, setSelectedCity] = useState(() => {
    return localStorage.getItem(STORAGE_KEY_CITY) || 'Hyderabad';
  });

  // Theatre-Curtain Animation State & Home Reset Counter
  const [isCurtainAnimating, setIsCurtainAnimating] = useState(false);
  const [homeResetCount, setHomeResetCount] = useState(0);

  // Simulated Time Offset in minutes (for SLA testing)
  const [timeOffsetMinutes, setTimeOffsetMinutes] = useState(() => {
    const saved = localStorage.getItem(STORAGE_KEY_OFFSET);
    return saved ? parseInt(saved, 10) : 0;
  });

  // Role Navigation: 'customer' | 'ops' | 'analytics' | 'inventory'
  const [activeRole, setActiveRole] = useState('customer');

  // Currently inspected case in Ops view
  const [selectedCaseId, setSelectedCaseId] = useState('CW-REQ-1091');

  // Customer Portal active Case ID for Confirmation Checkpoint
  const [customerActiveCaseId, setCustomerActiveCaseId] = useState(null);

  // Ops Filters
  const [activeQueueFilter, setActiveQueueFilter] = useState('ALL');
  const [activeStageFilter, setActiveStageFilter] = useState('ALL');
  const [activeStatusFilter, setActiveStatusFilter] = useState('ALL');
  const [activeSlaFilter, setActiveSlaFilter] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  // Live Simulated Timestamp
  const simulatedNow = Date.now() + (timeOffsetMinutes * 60 * 1000);

  // Persistence Effects
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY_MOVIES, JSON.stringify(movies));
  }, [movies]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY_SHOWS, JSON.stringify(shows));
  }, [shows]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY_CASES, JSON.stringify(cases));
  }, [cases]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY_OFFSET, timeOffsetMinutes.toString());
  }, [timeOffsetMinutes]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY_STATE, selectedState);
    localStorage.setItem(STORAGE_KEY_CITY, selectedCity);
  }, [selectedState, selectedCity]);

  // Periodic re-render timer every 10 seconds for real-time SLA clocks
  const [, setTick] = useState(0);
  useEffect(() => {
    const interval = setInterval(() => {
      setTick(t => t + 1);
    }, 10000);
    return () => clearInterval(interval);
  }, []);

  /**
   * Theatre Curtain Home Transition Trigger (1.0s duration)
   * Always navigates back to the home discovery catalog step 1
   */
  const triggerHomeCurtainTransition = () => {
    setIsCurtainAnimating(true);
    
    // Immediate state reset
    setActiveRole('customer');
    setCustomerActiveCaseId(null);
    setHomeResetCount(prev => prev + 1);
    window.scrollTo({ top: 0, behavior: 'smooth' });

    // End animation after 1000ms
    setTimeout(() => {
      setIsCurtainAnimating(false);
    }, 1000);
  };

  const setLocation = (stateName, cityName) => {
    setSelectedState(stateName);
    setSelectedCity(cityName);
  };

  /**
   * Helper to retrieve full referenced Show & Movie for a case
   */
  const getCaseEntities = (caseItem) => {
    if (!caseItem) return { movie: null, show: null };
    const show = shows.find(s => s.id === caseItem.showId) || null;
    const movie = show ? movies.find(m => m.id === show.movieId) : null;
    return { show, movie };
  };

  /**
   * Stage 1 -> Stage 2 -> Stage 3: Create Booking Request & Advance to Approval Checkpoint
   */
  const createBookingRequest = ({
    customerName,
    customerEmail,
    customerPhone,
    showId,
    seatCategory = 'STANDARD',
    seatCount = 1,
    selectedSeats = [],
    foodItems = [],
    paymentTxnId = null,
    paymentMethod = 'UPI',
  }) => {
    const show = shows.find(s => s.id === showId);
    if (!show) throw new Error('Referenced Show not found');

    const movie = movies.find(m => m.id === show.movieId);
    const count = Math.max(1, parseInt(seatCount, 10) || 1);
    const costCalc = calculateTotalCost(show, count, seatCategory, foodItems);

    // Queue Routing based on format/showType
    const assignedQueue = determineShowQueue(show.format, show.showType);

    const caseNumber = Math.floor(1100 + Math.random() * 8900);
    const caseId = `CW-REQ-${caseNumber}`;
    const nowIso = new Date(simulatedNow).toISOString();

    const isAvailable = show.seatsRemaining >= count;

    const initialHistory = [
      {
        stage: STAGES.INITIAL,
        action: 'Case Initialized',
        actor: `${customerName || 'Customer'} (Intake Flow)`,
        timestamp: nowIso,
        notes: `Customer requested ${count} seat(s) [${seatCategory}] for "${movie?.title || 'Movie'}" at ${show.theatre} (${show.city}, ${show.state}) with ${foodItems?.length || 0} F&B item(s). Routed to "${assignedQueue}". Payment authorized via ${paymentMethod}.`,
      },
    ];

    let finalStatus = STATUSES.PENDING_APPROVAL;
    let finalStage = STAGES.APPROVAL;

    if (isAvailable) {
      initialHistory.push({
        stage: STAGES.AVAILABILITY,
        action: 'Availability Check Passed',
        actor: 'System Availability Engine',
        timestamp: new Date(simulatedNow + 200).toISOString(),
        notes: `Auditorium capacity verified (${show.seatsRemaining} seats available at ${show.theatre}, Screen ${show.screen}). Cost calculated at ₹${costCalc.totalCost.toFixed(2)}. Case transitioned to Stage 3: Approval for customer confirmation.`,
      });
    } else {
      finalStatus = STATUSES.PENDING_AVAILABILITY;
      finalStage = STAGES.AVAILABILITY;
      initialHistory.push({
        stage: STAGES.AVAILABILITY,
        action: 'Capacity Constraint Flagged',
        actor: 'System Capacity Engine',
        timestamp: new Date(simulatedNow + 200).toISOString(),
        notes: `Selected show is at capacity (${show.seatsRemaining} seats left, requested ${count}). Assigned to Ops Dispatch queue for alternate show reassignment.`,
      });
    }

    const newCase = {
      caseId,
      customerName: customerName?.trim() || 'Guest Customer',
      customerEmail: customerEmail?.trim() || 'customer@example.in',
      customerPhone: customerPhone?.trim() || '+91 98000 00000',
      showId,
      seatCategory,
      seatCount: count,
      selectedSeats: selectedSeats.length > 0 ? selectedSeats : [`Auto-${seatCategory}-1`],
      foodItems: foodItems || [],
      totalCost: costCalc.totalCost,
      paymentTxnId: paymentTxnId || `CW-TXN-${Math.floor(100000 + Math.random() * 900000)}`,
      paymentMethod: paymentMethod || 'UPI',
      status: finalStatus,
      stage: finalStage,
      queue: assignedQueue,
      createdAt: nowIso,
      slaGoalAt: new Date(simulatedNow + (SLA_GOAL_HOURS * 3600 * 1000)).toISOString(),
      slaDeadlineAt: new Date(simulatedNow + (SLA_DEADLINE_HOURS * 3600 * 1000)).toISOString(),
      bookingReference: null,
      confirmedAt: null,
      resolvedAt: null,
      stageHistory: initialHistory,
      correspondenceLog: [],
    };

    setCases(prev => [newCase, ...prev]);
    setSelectedCaseId(caseId);
    setCustomerActiveCaseId(caseId);

    return newCase;
  };

  /**
   * Stage 2: Availability Check (Manual re-verification in Ops Console)
   */
  const runAvailabilityCheck = (caseId, actor = 'Staff Ops Agent') => {
    const targetCase = cases.find(c => c.caseId === caseId);
    if (!targetCase) return { success: false, message: 'Case not found' };

    const show = shows.find(s => s.id === targetCase.showId);
    if (!show) return { success: false, message: 'Referenced Show not found' };

    const isAvailable = show.seatsRemaining >= targetCase.seatCount;
    const nowIso = new Date(simulatedNow).toISOString();

    if (isAvailable) {
      const updatedHistory = [
        ...targetCase.stageHistory,
        {
          stage: STAGES.AVAILABILITY,
          action: 'Availability Verified — Passed',
          actor,
          timestamp: nowIso,
          notes: `Capacity verified (${show.seatsRemaining} seats available at ${show.theatre}, Screen ${show.screen}). Total Cost locked at ₹${targetCase.totalCost.toFixed(2)}. Case advanced to Stage 3: Approval.`,
        },
      ];

      const updatedCase = {
        ...targetCase,
        status: STATUSES.PENDING_APPROVAL,
        stage: STAGES.APPROVAL,
        stageHistory: updatedHistory,
      };

      setCases(prev => prev.map(c => c.caseId === caseId ? updatedCase : c));
      return { success: true, caseItem: updatedCase, remaining: show.seatsRemaining };
    } else {
      const updatedHistory = [
        ...targetCase.stageHistory,
        {
          stage: STAGES.AVAILABILITY,
          action: 'Availability Check Failed — Full Capacity',
          actor,
          timestamp: nowIso,
          notes: `Show is sold out (${show.seatsRemaining} seats remaining). Alternate show routing required.`,
        },
      ];

      const updatedCase = {
        ...targetCase,
        status: STATUSES.PENDING_AVAILABILITY,
        stage: STAGES.AVAILABILITY,
        stageHistory: updatedHistory,
      };

      setCases(prev => prev.map(c => c.caseId === caseId ? updatedCase : c));
      return { success: false, message: 'Show is at full capacity', caseItem: updatedCase };
    }
  };

  /**
   * Stage 3 -> Stage 4: Explicit Customer Confirmation & Execution
   */
  const confirmBooking = (caseId, actor = 'Customer Checkpoint') => {
    const targetCase = cases.find(c => c.caseId === caseId);
    if (!targetCase) return { success: false, message: 'Case not found' };

    const show = shows.find(s => s.id === targetCase.showId);
    const movie = show ? movies.find(m => m.id === show.movieId) : null;
    if (!show) return { success: false, message: 'Show not found' };

    if (show.seatsRemaining < targetCase.seatCount) {
      return { success: false, message: 'Cannot confirm: Show capacity exceeded.' };
    }

    const nowIso = new Date(simulatedNow).toISOString();
    const ticketRef = generateTicketReference();

    // 1. Decrement Show remaining capacity
    setShows(prev => prev.map(s => {
      if (s.id === show.id) {
        return {
          ...s,
          seatsRemaining: Math.max(0, s.seatsRemaining - targetCase.seatCount),
          availabilityStatus: (s.seatsRemaining - targetCase.seatCount) <= 10 ? 'ALMOST_FULL' : s.availabilityStatus,
        };
      }
      return s;
    }));

    // 2. Generate simulated email confirmation correspondence
    const caseWithTicketRef = {
      ...targetCase,
      bookingReference: ticketRef,
      confirmedAt: nowIso,
    };
    const correspondence = createConfirmationCorrespondence(caseWithTicketRef, show, movie);

    // 3. Stage 3 (Approval) -> Stage 4 (Booking Execution)
    const updatedHistory = [
      ...targetCase.stageHistory,
      {
        stage: STAGES.APPROVAL,
        action: 'Customer Explicit Confirmation Received',
        actor,
        timestamp: nowIso,
        notes: `Customer reviewed seats [${targetCase.selectedSeats.join(', ')}] and total cost (₹${targetCase.totalCost.toFixed(2)}) and explicitly confirmed reservation at checkpoint.`,
      },
      {
        stage: STAGES.EXECUTION,
        action: 'Booking Execution & Inventory Lock',
        actor: 'Execution Worker (Stage 4)',
        timestamp: nowIso,
        notes: `Locked ${targetCase.seatCount} seats in ${show.screen}. Generated Booking Reference "${ticketRef}". Entry barcode active. Correspondence dispatched to ${targetCase.customerEmail}. Case resolved.`,
      },
    ];

    const updatedCase = {
      ...targetCase,
      status: STATUSES.RESOLVED_CONFIRMED,
      stage: STAGES.EXECUTION,
      bookingReference: ticketRef,
      confirmedAt: nowIso,
      resolvedAt: nowIso,
      stageHistory: updatedHistory,
      correspondenceLog: [correspondence, ...(targetCase.correspondenceLog || [])],
    };

    setCases(prev => prev.map(c => c.caseId === caseId ? updatedCase : c));
    return { success: true, caseItem: updatedCase, ticketRef };
  };

  /**
   * Cancel Booking (at Approval Checkpoint or from Ops Console)
   */
  const cancelBooking = (caseId, reason = 'Cancelled by customer at approval checkpoint', actor = 'Customer Checkpoint') => {
    const targetCase = cases.find(c => c.caseId === caseId);
    if (!targetCase) return;

    const nowIso = new Date(simulatedNow).toISOString();

    const updatedHistory = [
      ...targetCase.stageHistory,
      {
        stage: targetCase.stage,
        action: 'Booking Request Cancelled',
        actor,
        timestamp: nowIso,
        notes: `Booking request cancelled. Reason: ${reason}. No seats locked. Case marked as Resolved-Cancelled.`,
      },
    ];

    const updatedCase = {
      ...targetCase,
      status: STATUSES.RESOLVED_CANCELLED,
      stage: STAGES.APPROVAL,
      resolvedAt: nowIso,
      stageHistory: updatedHistory,
    };

    setCases(prev => prev.map(c => c.caseId === caseId ? updatedCase : c));
    return { success: true, caseItem: updatedCase };
  };

  /**
   * Process Refund
   */
    const processRefund = (caseId, actor = 'Staff Finance Agent', customReason = '') => {
    const targetCase = cases.find(c => c.caseId === caseId);
    if (!targetCase) return { success: false, message: 'Case not found' };

    const show = shows.find(s => s.id === targetCase.showId);
    let hoursRemaining = 24;
    if (show && show.date && show.time) {
      const showDateTime = new Date(`${show.date}T${show.time}`);
      if (!isNaN(showDateTime.getTime())) {
        hoursRemaining = Math.max(0, (showDateTime.getTime() - simulatedNow) / (1000 * 60 * 60));
      }
    }

    const refundDetails = calculateRefundAmount(targetCase.totalCost, hoursRemaining);
    const nowIso = new Date(simulatedNow).toISOString();

    // Release seats back to show inventory if confirmed
    if (show && targetCase.status === STATUSES.RESOLVED_CONFIRMED) {
      setShows(prev => prev.map(s => {
        if (s.id === show.id) {
          return {
            ...s,
            seatsRemaining: Math.min(s.totalCapacity, s.seatsRemaining + targetCase.seatCount),
          };
        }
        return s;
      }));
    }

    const feeAmount = refundDetails.deductionAmount ?? refundDetails.cancellationFee;
    const refundNotes = customReason 
      ? `Refund processed (${refundDetails.policyTierLabel}): ₹${refundDetails.refundAmount.toFixed(2)} refunded. Reason: ${customReason}.`
      : `Refund processed (${refundDetails.policyTierLabel}): ₹${refundDetails.refundAmount.toFixed(2)} refunded (${refundDetails.refundPercentage}% refund, cancellation fee ₹${feeAmount.toFixed(2)}).`;

    const updatedHistory = [
      ...targetCase.stageHistory,
      {
        stage: targetCase.stage,
        action: 'Refund & Cancellation Executed',
        actor,
        timestamp: nowIso,
        notes: refundNotes,
      },
    ];

    const updatedCase = {
      ...targetCase,
      status: STATUSES.RESOLVED_REFUNDED,
      resolvedAt: nowIso,
      refundDetails: {
        amount: refundDetails.refundAmount,
        deduction: feeAmount,
        percentage: refundDetails.refundPercentage,
        policyTierLabel: refundDetails.policyTierLabel,
        processedAt: nowIso,
        reason: customReason || `${refundDetails.policyTierLabel} - Customer cancellation`,
      },
      stageHistory: updatedHistory,
    };

    setCases(prev => prev.map(c => c.caseId === caseId ? updatedCase : c));
    return { success: true, caseItem: updatedCase, refundDetails };
  };

  /**
   * Reschedule Booking to Alternate Show
   */
const rescheduleBooking = (caseId, newShowId, actor = 'Staff Ops Agent') => {
    const targetCase = cases.find(c => c.caseId === caseId);
    const newShow = shows.find(s => s.id === newShowId);
    const oldShow = shows.find(s => s.id === targetCase?.showId);
    if (!targetCase || !newShow) return { success: false, message: 'Invalid case or show' };

    if (newShow.seatsRemaining < targetCase.seatCount) {
      return { success: false, message: 'Target show does not have sufficient seats' };
    }

    const nowIso = new Date(simulatedNow).toISOString();

    // Release old seats
    if (oldShow && targetCase.status === STATUSES.RESOLVED_CONFIRMED) {
      setShows(prev => prev.map(s => s.id === oldShow.id ? { ...s, seatsRemaining: s.seatsRemaining + targetCase.seatCount } : s));
    }
    // Lock new seats
    setShows(prev => prev.map(s => s.id === newShow.id ? { ...s, seatsRemaining: s.seatsRemaining - targetCase.seatCount } : s));

    const newQueue = determineShowQueue(newShow.format, newShow.showType);

    const updatedHistory = [
      ...targetCase.stageHistory,
      {
        stage: targetCase.stage,
        action: 'Show Rescheduled',
        actor,
        timestamp: nowIso,
        notes: `Show changed from ${oldShow?.theatre} (${oldShow?.date} ${oldShow?.time}) to ${newShow.theatre} (${newShow.date} ${newShow.time}). Queue updated to "${newQueue}".`,
      },
    ];

    const updatedCase = {
      ...targetCase,
      showId: newShowId,
      queue: newQueue,
      stageHistory: updatedHistory,
    };

    setCases(prev => prev.map(c => c.caseId === caseId ? updatedCase : c));
    return { success: true, caseItem: updatedCase };
  };

  /**
   * Reassign Queue
   */
  const reassignQueue = (caseId, newQueue) => {
    const targetCase = cases.find(c => c.caseId === caseId);
    if (!targetCase || targetCase.queue === newQueue) return;

    const nowIso = new Date(simulatedNow).toISOString();

    const updatedHistory = [
      ...targetCase.stageHistory,
      {
        stage: targetCase.stage,
        action: 'Queue Reassignment',
        actor: 'Staff Dispatcher',
        timestamp: nowIso,
        notes: `Queue changed from "${targetCase.queue}" to "${newQueue}".`,
      },
    ];

    const updatedCase = {
      ...targetCase,
      queue: newQueue,
      stageHistory: updatedHistory,
    };

    setCases(prev => prev.map(c => c.caseId === caseId ? updatedCase : c));
  };

  /**
   * Movie Management CRUD (Staff Console)
   */
  const addMovie = (movieData) => {
    const id = `MOV-${Math.floor(106 + Math.random() * 890)}`;
    const newMovie = {
      id,
      title: movieData.title || 'Untitled Movie',
      genre: movieData.genre || 'Action • Thriller',
      language: movieData.language || 'English, Hindi',
      durationMinutes: parseInt(movieData.durationMinutes, 10) || 120,
      certificate: movieData.certificate || 'UA 13+',
      ratingScore: parseFloat(movieData.ratingScore) || 8.0,
      votesCount: movieData.votesCount || '10K votes',
      synopsis: movieData.synopsis || 'Movie synopsis...',
      posterUrl: movieData.posterUrl || 'https://images.unsplash.com/photo-1536440136628-849c177e76a1?w=600&auto=format&fit=crop&q=80',
      bannerUrl: movieData.bannerUrl || 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=1200&auto=format&fit=crop&q=80',
      tags: movieData.tags || ['Now Showing'],
      formats: movieData.formats || ['IMAX 2D', '2D'],
      accentColor: movieData.accentColor || '#B91C1C',
    };
    setMovies(prev => [newMovie, ...prev]);
    return newMovie;
  };

  const updateMovie = (movieId, updatedFields) => {
    setMovies(prev => prev.map(m => {
      if (m.id === movieId) {
        return {
          ...m,
          ...updatedFields,
          durationMinutes: updatedFields.durationMinutes ? parseInt(updatedFields.durationMinutes, 10) : m.durationMinutes,
          ratingScore: updatedFields.ratingScore ? parseFloat(updatedFields.ratingScore) : m.ratingScore,
        };
      }
      return m;
    }));
  };

  const deleteMovie = (movieId) => {
    // Check if shows exist
    const hasShows = shows.some(s => s.movieId === movieId);
    if (hasShows) {
      return { success: false, message: 'Cannot delete movie: active scheduled showtimes exist for this title.' };
    }
    setMovies(prev => prev.filter(m => m.id !== movieId));
    return { success: true };
  };

  /**
   * Show inventory capacity updates (Show Manager)
   */
  const updateShowCapacity = (showId, totalCapacity, seatsRemaining) => {
    setShows(prev => prev.map(s => {
      if (s.id === showId) {
        return {
          ...s,
          totalCapacity: Math.max(1, parseInt(totalCapacity, 10) || s.totalCapacity),
          seatsRemaining: Math.max(0, parseInt(seatsRemaining, 10) || s.seatsRemaining),
        };
      }
      return s;
    }));
  };

  const updateShowPricing = (showId, basePrice) => {
    setShows(prev => prev.map(s => {
      if (s.id === showId) {
        return {
          ...s,
          basePrice: parseFloat(basePrice) || s.basePrice,
        };
      }
      return s;
    }));
  };

  const addShow = (showData) => {
    const id = `SHW-${showData.city?.slice(0, 3).toUpperCase() || 'IND'}-${Math.floor(810 + Math.random() * 180)}`;
    const format = showData.format || 'Standard 2D';
    const showType = showData.showType || (format.match(/IMAX|4DX|Dolby|70mm|Luxe|VIP/i) ? SHOW_TYPES.PREMIUM : SHOW_TYPES.STANDARD);

    const newShow = {
      id,
      movieId: showData.movieId,
      state: showData.state || selectedState,
      city: showData.city || selectedCity,
      theatre: showData.theatre,
      theatreLocation: showData.theatreLocation || `${showData.city} Multiplex`,
      screen: showData.screen,
      date: showData.date,
      time: showData.time,
      format,
      showType,
      totalCapacity: parseInt(showData.totalCapacity, 10) || 150,
      seatsRemaining: parseInt(showData.seatsRemaining, 10) || 150,
      availabilityStatus: 'AVAILABLE',
      basePrice: parseFloat(showData.basePrice) || 250,
      seatCategoriesAvailable: ['STANDARD', 'PRIME', 'RECLINER'],
    };
    setShows(prev => [newShow, ...prev]);
    return newShow;
  };

  const deleteShow = (showId) => {
    const hasCases = cases.some(c => c.showId === showId && c.status !== STATUSES.RESOLVED_CANCELLED && c.status !== STATUSES.RESOLVED_REFUNDED);
    if (hasCases) {
      return { success: false, message: 'Cannot delete showtime: active booking cases are linked.' };
    }
    setShows(prev => prev.filter(s => s.id !== showId));
    return { success: true };
  };

  const advanceSimulatedTime = (hours) => {
    setTimeOffsetMinutes(prev => prev + (hours * 60));
  };

  const resetSimulatedTime = () => {
    setTimeOffsetMinutes(0);
  };

  const resetData = () => {
    setMovies(sanitizeEncoding(INITIAL_MOVIES));
    setShows(sanitizeEncoding(INITIAL_SHOWS));
    setCases(sanitizeEncoding(INITIAL_CASES));
    setTimeOffsetMinutes(0);
    setSelectedState('Telangana');
    setSelectedCity('Hyderabad');
    localStorage.removeItem(STORAGE_KEY_MOVIES);
    localStorage.removeItem(STORAGE_KEY_SHOWS);
    localStorage.removeItem(STORAGE_KEY_CASES);
    localStorage.removeItem(STORAGE_KEY_OFFSET);
    localStorage.removeItem(STORAGE_KEY_CITY);
    localStorage.removeItem(STORAGE_KEY_STATE);
    setSelectedCaseId('CW-REQ-1091');
    setCustomerActiveCaseId(null);
  };

  // Filtered cases for Ops table
  const filteredCases = cases.filter(c => {
    if (activeQueueFilter !== 'ALL' && c.queue !== activeQueueFilter) return false;
    if (activeStageFilter !== 'ALL') {
      if (!c.stage?.includes(activeStageFilter) && c.stage !== activeStageFilter) return false;
    }
    if (activeStatusFilter !== 'ALL' && c.status !== activeStatusFilter) return false;
    if (activeSlaFilter !== 'ALL') {
      const sla = calculateSLA(c, simulatedNow);
      if (activeSlaFilter === 'ON_TRACK' && sla.state !== SLA_STATES.ON_TRACK) return false;
      if (activeSlaFilter === 'AT_RISK' && sla.state !== SLA_STATES.APPROACHING_GOAL) return false;
      if (activeSlaFilter === 'BREACHED' && (sla.state !== SLA_STATES.GOAL_BREACHED && sla.state !== SLA_STATES.DEADLINE_BREACHED)) return false;
    }
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      const { movie, show } = getCaseEntities(c);
      const matchId = c.caseId.toLowerCase().includes(query);
      const matchName = c.customerName.toLowerCase().includes(query);
      const matchEmail = c.customerEmail.toLowerCase().includes(query);
      const matchMovie = movie?.title?.toLowerCase().includes(query);
      const matchTheatre = show?.theatre?.toLowerCase().includes(query);
      const matchCity = show?.city?.toLowerCase().includes(query);
      if (!matchId && !matchName && !matchEmail && !matchMovie && !matchTheatre && !matchCity) return false;
    }
    return true;
  });

  const confirmedCases = cases.filter(c => c.status === STATUSES.RESOLVED_CONFIRMED);
  const totalGrossRevenue = confirmedCases.reduce((sum, c) => sum + (c.totalCost || 0), 0);

  const metrics = {
    totalCases: cases.length,
    activeCases: cases.filter(c => c.status !== STATUSES.RESOLVED_CONFIRMED && c.status !== STATUSES.RESOLVED_CANCELLED && c.status !== STATUSES.RESOLVED_REFUNDED).length,
    premiumQueueCount: cases.filter(c => c.queue === QUEUES.PREMIUM && c.status !== STATUSES.RESOLVED_CONFIRMED && c.status !== STATUSES.RESOLVED_CANCELLED && c.status !== STATUSES.RESOLVED_REFUNDED).length,
    standardQueueCount: cases.filter(c => c.queue === QUEUES.STANDARD && c.status !== STATUSES.RESOLVED_CONFIRMED && c.status !== STATUSES.RESOLVED_CANCELLED && c.status !== STATUSES.RESOLVED_REFUNDED).length,
    atRiskCount: cases.filter(c => {
      if (c.status === STATUSES.RESOLVED_CONFIRMED || c.status === STATUSES.RESOLVED_CANCELLED || c.status === STATUSES.RESOLVED_REFUNDED) return false;
      const sla = calculateSLA(c, simulatedNow);
      return sla.state === SLA_STATES.APPROACHING_GOAL;
    }).length,
    breachedCount: cases.filter(c => {
      if (c.status === STATUSES.RESOLVED_CONFIRMED || c.status === STATUSES.RESOLVED_CANCELLED || c.status === STATUSES.RESOLVED_REFUNDED) return false;
      const sla = calculateSLA(c, simulatedNow);
      return sla.state === SLA_STATES.GOAL_BREACHED || sla.state === SLA_STATES.DEADLINE_BREACHED;
    }).length,
    confirmedToday: confirmedCases.length,
    totalGrossRevenue,
  };

  const selectedCase = cases.find(c => c.caseId === selectedCaseId) || cases[0] || null;

  return (
    <CaseContext.Provider
      value={{
        movies,
        shows,
        cases,
        filteredCases,
        selectedCase,
        selectedCaseId,
        setSelectedCaseId,
        selectedState,
        selectedCity,
        setLocation,
        isCurtainAnimating,
        homeResetCount,
        triggerHomeCurtainTransition,
        activeRole,
        setActiveRole,
        customerActiveCaseId,
        setCustomerActiveCaseId,
        simulatedNow,
        timeOffsetMinutes,
        metrics,
        activeQueueFilter,
        setActiveQueueFilter,
        activeStageFilter,
        setActiveStageFilter,
        activeStatusFilter,
        setActiveStatusFilter,
        activeSlaFilter,
        setActiveSlaFilter,
        searchQuery,
        setSearchQuery,
        getCaseEntities,
        createBookingRequest,
        runAvailabilityCheck,
        confirmBooking,
        cancelBooking,
        processRefund,
        rescheduleBooking,
        reassignQueue,
        addMovie,
        updateMovie,
        deleteMovie,
        updateShowCapacity,
        updateShowPricing,
        addShow,
        deleteShow,
        advanceSimulatedTime,
        resetSimulatedTime,
        resetData,
      }}
    >
      {children}
    </CaseContext.Provider>
  );
}

export function useCaseContext() {
  const context = useContext(CaseContext);
  if (!context) {
    throw new Error('useCaseContext must be used within a CaseProvider');
  }
  return context;
}