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
  SEAT_CATEGORIES,
  LOCATIONS,
  SLA_GOAL_HOURS, 
  SLA_DEADLINE_HOURS 
} from '../data/types';
import { calculateTotalCost, calculateRefundAmount } from '../utils/costCalculator';
import { generateTicketReference, createConfirmationCorrespondence } from '../utils/ticketGenerator';
import { calculateSLA, SLA_STATES } from '../utils/slaCalculator';

const CaseContext = createContext();

const STORAGE_KEY_MOVIES = 'cinewave_movies_v4';
const STORAGE_KEY_SHOWS = 'cinewave_shows_v4';
const STORAGE_KEY_CASES = 'cinewave_cases_v4';
const STORAGE_KEY_OFFSET = 'cinewave_time_offset_v4';
const STORAGE_KEY_CITY = 'cinewave_city_v4';
const STORAGE_KEY_STATE = 'cinewave_state_v4';

export function CaseProvider({ children }) {
  // 1. Core State
  const [movies, setMovies] = useState(() => {
    const saved = localStorage.getItem(STORAGE_KEY_MOVIES);
    return saved ? JSON.parse(saved) : INITIAL_MOVIES;
  });

  const [shows, setShows] = useState(() => {
    const saved = localStorage.getItem(STORAGE_KEY_SHOWS);
    return saved ? JSON.parse(saved) : INITIAL_SHOWS;
  });

  const [cases, setCases] = useState(() => {
    const saved = localStorage.getItem(STORAGE_KEY_CASES);
    return saved ? JSON.parse(saved) : INITIAL_CASES;
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
   * Theatre Curtain Home Transition Trigger (Smooth 1.1s duration)
   * Always navigates back to the home discovery catalog step 1
   */
  const triggerHomeCurtainTransition = () => {
    setIsCurtainAnimating(true);
    
    // Immediate state reset
    setActiveRole('customer');
    setCustomerActiveCaseId(null);
    setHomeResetCount(prev => prev + 1);
    window.scrollTo({ top: 0, behavior: 'smooth' });

    // End animation after 1120ms
    setTimeout(() => {
      setIsCurtainAnimating(false);
    }, 1120);
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
   * Stage 1: Create a new Booking Request Case
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

    const assignedQueue = show.showType === SHOW_TYPES.PREMIUM 
      ? QUEUES.PREMIUM 
      : QUEUES.STANDARD;

    const caseNumber = Math.floor(1100 + Math.random() * 8900);
    const caseId = `CW-REQ-${caseNumber}`;
    const nowIso = new Date(simulatedNow).toISOString();

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
      status: STATUSES.NEW,
      stage: STAGES.INTAKE,
      queue: assignedQueue,
      createdAt: nowIso,
      slaGoalAt: new Date(simulatedNow + (SLA_GOAL_HOURS * 3600 * 1000)).toISOString(),
      slaDeadlineAt: new Date(simulatedNow + (SLA_DEADLINE_HOURS * 3600 * 1000)).toISOString(),
      bookingReference: null,
      confirmedAt: null,
      resolvedAt: null,
      stageHistory: [
        {
          stage: STAGES.INTAKE,
          action: 'Case Intake Initialized',
          actor: `${customerName || 'Customer'} (Intake Flow)`,
          timestamp: nowIso,
          notes: `Requested ${count} seat(s) [${seatCategory}] for "${movie?.title || 'Movie'}" at ${show.theatre} (${show.city}, ${show.state}) with ${foodItems?.length || 0} F&B item(s). Payment authorized via ${paymentMethod}. Initial calculated cost: ₹${costCalc.totalCost.toFixed(2)}.`,
        },
      ],
      correspondenceLog: [],
    };

    setCases(prev => [newCase, ...prev]);
    setSelectedCaseId(caseId);
    setCustomerActiveCaseId(caseId);

    return newCase;
  };

  /**
   * Stage 2: Availability Verification
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
      const alternateShows = shows.filter(
        s => s.movieId === show.movieId && s.city === show.city && s.id !== show.id && s.seatsRemaining >= targetCase.seatCount
      );

      const updatedHistory = [
        ...targetCase.stageHistory,
        {
          stage: STAGES.AVAILABILITY,
          action: 'Availability Check — Insufficient Capacity',
          actor,
          timestamp: nowIso,
          notes: `Capacity deficit detected at ${show.theatre}. Requested: ${targetCase.seatCount}, Available: ${show.seatsRemaining}. Case requires alternate show selection.`,
        },
      ];

      const updatedCase = {
        ...targetCase,
        status: STATUSES.PENDING_AVAILABILITY,
        stage: STAGES.AVAILABILITY,
        stageHistory: updatedHistory,
      };

      setCases(prev => prev.map(c => c.caseId === caseId ? updatedCase : c));
      return { 
        success: false, 
        caseItem: updatedCase, 
        remaining: show.seatsRemaining, 
        deficit: targetCase.seatCount - show.seatsRemaining,
        alternateShows,
      };
    }
  };

  /**
   * Stage 3 & 4: Confirm Booking
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
        };
      }
      return s;
    }));

    // 2. Generate correspondence
    const correspondenceItem = createConfirmationCorrespondence(
      { ...targetCase, bookingReference: ticketRef },
      show,
      movie
    );

    // 3. Update Case history
    const updatedHistory = [
      ...targetCase.stageHistory,
      {
        stage: STAGES.APPROVAL,
        action: 'Booking Approved & Authorized',
        actor,
        timestamp: nowIso,
        notes: `Explicit customer confirmation received. Total cost authorized: ₹${targetCase.totalCost.toFixed(2)}. Case advanced to Stage 4: Booking Execution.`,
      },
      {
        stage: STAGES.EXECUTION,
        action: 'Booking Executed & Seats Reserved',
        actor: 'Stage 4 Execution Engine',
        timestamp: nowIso,
        notes: `Reserved ${targetCase.seatCount} seats on Show ${show.id} at ${show.theatre} (${show.city}). Generated Ticket Ref ${ticketRef}. Dispatched confirmation correspondence. Case resolved.`,
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
      correspondenceLog: [correspondenceItem, ...(targetCase.correspondenceLog || [])],
    };

    setCases(prev => prev.map(c => c.caseId === caseId ? updatedCase : c));
    return { success: true, caseItem: updatedCase, ticketRef };
  };

  /**
   * Cancel Booking
   */
  const cancelBooking = (caseId, reason = 'Cancelled by customer', actor = 'Customer Checkpoint') => {
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
      resolvedAt: nowIso,
      stageHistory: updatedHistory,
    };

    setCases(prev => prev.map(c => c.caseId === caseId ? updatedCase : c));
  };

  /**
   * Process Refund (Cancellation with Refund)
   */
  const processRefund = (caseId, reason = 'Customer requested cancellation with refund', actor = 'Staff Ops Agent') => {
    const targetCase = cases.find(c => c.caseId === caseId);
    if (!targetCase) return { success: false, message: 'Case not found' };

    const show = shows.find(s => s.id === targetCase.showId);
    const refundCalc = calculateRefundAmount(targetCase.totalCost, 24);
    const nowIso = new Date(simulatedNow).toISOString();

    // If case was confirmed, restore show seat capacity
    if (targetCase.status === STATUSES.RESOLVED_CONFIRMED && show) {
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

    const updatedHistory = [
      ...targetCase.stageHistory,
      {
        stage: targetCase.stage,
        action: 'Booking Cancelled & Refund Processed',
        actor,
        timestamp: nowIso,
        notes: `Issued ${refundCalc.refundPercentage}% refund of ₹${refundCalc.refundAmount.toFixed(2)} (cancellation fee: ₹${refundCalc.cancellationFee.toFixed(2)}). Reason: ${reason}. Seats released back to inventory.`,
      },
    ];

    const updatedCase = {
      ...targetCase,
      status: STATUSES.RESOLVED_REFUNDED,
      refundAmount: refundCalc.refundAmount,
      cancellationFee: refundCalc.cancellationFee,
      resolvedAt: nowIso,
      stageHistory: updatedHistory,
    };

    setCases(prev => prev.map(c => c.caseId === caseId ? updatedCase : c));
    return { success: true, caseItem: updatedCase, refundCalc };
  };

  /**
   * Reschedule Booking to an Alternate Show
   */
  const rescheduleBooking = (caseId, newShowId, newSeats = [], actor = 'Staff Ops Agent') => {
    const targetCase = cases.find(c => c.caseId === caseId);
    if (!targetCase) return { success: false, message: 'Case not found' };

    const oldShow = shows.find(s => s.id === targetCase.showId);
    const newShow = shows.find(s => s.id === newShowId);
    if (!newShow) return { success: false, message: 'New Show not found' };

    if (newShow.seatsRemaining < targetCase.seatCount) {
      return { success: false, message: 'Selected new show has insufficient capacity' };
    }

    const nowIso = new Date(simulatedNow).toISOString();

    // 1. Release seats from old show
    if (oldShow && targetCase.status === STATUSES.RESOLVED_CONFIRMED) {
      setShows(prev => prev.map(s => {
        if (s.id === oldShow.id) {
          return { ...s, seatsRemaining: Math.min(s.totalCapacity, s.seatsRemaining + targetCase.seatCount) };
        }
        if (s.id === newShow.id) {
          return { ...s, seatsRemaining: Math.max(0, s.seatsRemaining - targetCase.seatCount) };
        }
        return s;
      }));
    }

    const updatedHistory = [
      ...targetCase.stageHistory,
      {
        stage: targetCase.stage,
        action: 'Showtime Rescheduled',
        actor,
        timestamp: nowIso,
        notes: `Rescheduled from ${oldShow?.theatre} (${oldShow?.date} ${oldShow?.time}) to ${newShow.theatre} (${newShow.date} ${newShow.time}). New seats: ${newSeats.join(', ') || targetCase.selectedSeats?.join(', ')}.`,
      },
    ];

    const updatedCase = {
      ...targetCase,
      showId: newShowId,
      selectedSeats: newSeats.length > 0 ? newSeats : targetCase.selectedSeats,
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

  /**
   * Show pricing update (in INR)
   */
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

  /**
   * Add a new Show with location
   */
  const addShow = (showData) => {
    const id = `SHW-${showData.city?.slice(0, 3).toUpperCase() || 'IND'}-${Math.floor(810 + Math.random() * 180)}`;
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
      format: showData.format || 'Standard 2D',
      showType: showData.showType || SHOW_TYPES.STANDARD,
      totalCapacity: parseInt(showData.totalCapacity, 10) || 150,
      seatsRemaining: parseInt(showData.seatsRemaining, 10) || 150,
      availabilityStatus: 'AVAILABLE',
      basePrice: parseFloat(showData.basePrice) || 250,
      seatCategoriesAvailable: ['STANDARD', 'PRIME', 'RECLINER'],
    };
    setShows(prev => [newShow, ...prev]);
    return newShow;
  };

  const advanceSimulatedTime = (hours) => {
    setTimeOffsetMinutes(prev => prev + (hours * 60));
  };

  const resetSimulatedTime = () => {
    setTimeOffsetMinutes(0);
  };

  const resetData = () => {
    setMovies(INITIAL_MOVIES);
    setShows(INITIAL_SHOWS);
    setCases(INITIAL_CASES);
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
        updateShowCapacity,
        updateShowPricing,
        addShow,
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
