'use client';

import { useEffect, useMemo, useState } from 'react';
import NavLink from '../NavLink';

const MARKET_PRESETS = {
  india: {
    currency: 'INR',
    salary: { min: 20000, max: 150000, defaultValue: 35000, step: 5000 },
    staff: { min: 1, max: 50, defaultValue: 10, step: 1 },
    automation: { min: 20, max: 90, defaultValue: 60, step: 5 },
    dailyRevenue: { min: 5000, max: 2500000, defaultValue: 100000, step: 5000 },
    upsell: { min: 1, max: 100, defaultValue: 25, step: 5 },
  },
  global: {
    currency: 'USD',
    salary: { min: 2500, max: 30000, defaultValue: 5000, step: 500 },
    staff: { min: 1, max: 100, defaultValue: 10, step: 1 },
    automation: { min: 20, max: 90, defaultValue: 60, step: 5 },
    dailyRevenue: { min: 2000, max: 1000000, defaultValue: 100000, step: 1000 },
    upsell: { min: 1, max: 100, defaultValue: 25, step: 5 },
  },
};

function formatCurrency(value, currency) {
  let local;
  switch (currency) {
    case 'INR':
      local = 'en-IN';
      break;
    case 'USD':
      local = 'en-US';
      break;
    default:
      local = 'en-US';
  }

  return value.toLocaleString(local, {
    style: 'currency',
    currency,
    maximumFractionDigits: 0,
  });
}

export default function CostSavingsCalculator() {
  const [selectedMarket, setSelectedMarket] = useState('global');
  const preset = useMemo(() => MARKET_PRESETS[selectedMarket], [selectedMarket]);
  const [monthlySalary, setMonthlySalary] = useState(preset.salary.defaultValue);
  const [staffCount, setStaffCount] = useState(preset.staff.defaultValue);
  const [automationPercent, setAutomationPercent] = useState(preset.automation.defaultValue);
  const [dailyRoomRevenue, setDailyRoomRevenue] = useState(preset.dailyRevenue.defaultValue);
  const [upsellPercent, setUpsellPercent] = useState(preset.upsell.defaultValue);

  // Reset sliders when market changes
  useEffect(() => {
    setMonthlySalary(preset.salary.defaultValue);
    setStaffCount(preset.staff.defaultValue);
    setAutomationPercent(preset.automation.defaultValue);
    setDailyRoomRevenue(preset.dailyRevenue.defaultValue);
    setUpsellPercent(preset.upsell.defaultValue);
  }, [preset, selectedMarket]);

  const { annualLaborSavings, annualUpsellRevenue, totalAnnualValue, monthlyValue } =
    useMemo(() => {
      const labor = monthlySalary * staffCount * (automationPercent / 100) * 12;
      const upsell = dailyRoomRevenue * (upsellPercent / 100) * 365;
      const total = labor + upsell;
      return {
        annualLaborSavings: labor,
        annualUpsellRevenue: upsell,
        totalAnnualValue: total,
        monthlyValue: total / 12,
      };
    }, [monthlySalary, staffCount, automationPercent, dailyRoomRevenue, upsellPercent]);

  return (
    <section className="w-full max-w-3xl rounded-2xl border border-gray-800 bg-gray-900 p-6 shadow-xl backdrop-blur">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="mt-1 text-md text-gray-400">Adjust the sliders to match your hotel.</p>
        </div>

        {/* Market toggle */}
        <div className="flex items-center gap-2 rounded-full border border-gray-700 bg-gray-800 px-2 py-1 text-xs">
          <button
            onClick={() => setSelectedMarket('india')}
            className={`rounded-full px-3 py-1 ${
              selectedMarket === 'india' ? 'bg-indigo-600 text-white' : 'text-gray-400'
            }`}
          >
            India
          </button>
          <button
            onClick={() => setSelectedMarket('global')}
            className={`rounded-full px-3 py-1 ${
              selectedMarket === 'global' ? 'bg-indigo-600 text-white' : 'text-gray-400'
            }`}
          >
            Global
          </button>
        </div>
      </div>

      <div className="mt-6 grid gap-6 md:grid-cols-2">
        {/* Labor inputs */}
        <div className="space-y-5">
          <h3 className="text-md font-medium text-gray-100">Labor and Automation</h3>

          {/* Monthly salary */}
          <div>
            <div className="flex items-center justify-between text-sm text-gray-300/90">
              <span>Average monthly salary per staff</span>
              <span>{formatCurrency(monthlySalary, preset.currency)}</span>
            </div>
            <input
              type="range"
              min={preset.salary.min}
              max={preset.salary.max}
              step={preset.salary.step}
              value={monthlySalary}
              onChange={(e) => setMonthlySalary(Number(e.target.value))}
              className="mt-2 w-full"
            />
          </div>

          {/* Staff count */}
          <div>
            <div className="flex items-center justify-between text-sm text-gray-300/90">
              <span>Staff handling calls and guest requests</span>
              <span>{staffCount}</span>
            </div>
            <input
              type="range"
              min={preset.staff.min}
              max={preset.staff.max}
              step={preset.staff.step}
              value={staffCount}
              onChange={(e) => setStaffCount(Number(e.target.value))}
              className="mt-2 w-full"
            />
          </div>

          {/* Automation percent */}
          <div>
            <div className="flex items-center justify-between text-sm text-gray-300/90">
              <span>Percent of workload Room Mitra can automate</span>
              <span>{automationPercent}%</span>
            </div>
            <input
              type="range"
              min={preset.automation.min}
              max={preset.automation.max}
              step={preset.automation.step}
              value={automationPercent}
              onChange={(e) => setAutomationPercent(Number(e.target.value))}
              className="mt-2 w-full"
            />
          </div>
        </div>

        {/* Revenue inputs */}
        <div className="space-y-5">
          <h3 className="text-md font-medium text-gray-100">Room Revenue and Upsell</h3>

          {/* Daily room revenue */}
          <div>
            <div className="flex items-center justify-between text-sm text-gray-300/90">
              <span>Average daily room revenue</span>
              <span>{formatCurrency(dailyRoomRevenue, preset.currency)}</span>
            </div>
            <input
              type="range"
              min={preset.dailyRevenue.min}
              max={preset.dailyRevenue.max}
              step={preset.dailyRevenue.step}
              value={dailyRoomRevenue}
              onChange={(e) => setDailyRoomRevenue(Number(e.target.value))}
              className="mt-2 w-full"
            />
            <p className="mt-1 text-sm text-gray-500">
              Total room revenue your hotel makes on an average day.
            </p>
          </div>

          {/* Upsell percent */}
          <div>
            <div className="flex items-center justify-between text-sm text-gray-300/90">
              <span>Expected upsell from Room Mitra</span>
              <span>{upsellPercent}%</span>
            </div>
            <input
              type="range"
              min={preset.upsell.min}
              max={preset.upsell.max}
              step={upsellPercent === 5 ? 4 : preset.upsell.step}
              value={upsellPercent}
              onChange={(e) => setUpsellPercent(Number(e.target.value))}
              className="mt-2 w-full"
            />
            <p className="mt-1 text-sm text-gray-500">
              Additional revenue from in room upsells like spa, F&amp;B, and upgrades.
            </p>
          </div>
        </div>
      </div>

      {/* Results */}
      <div className="mt-8 grid gap-4 md:grid-cols-3">
        <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/5 p-4">
          <p className="text-sm font-medium uppercase tracking-wide text-emerald-300">
            Annual labor savings
          </p>
          <p className="mt-2 text-lg font-semibold text-emerald-100">
            {formatCurrency(annualLaborSavings, preset.currency)}
          </p>
          <p className="mt-1 text-xs text-emerald-200/80">
            From reduced phone load, fewer overtime hours, and leaner shifts.
          </p>
        </div>

        <div className="rounded-xl border border-sky-500/30 bg-sky-500/5 p-4">
          <p className="text-sm font-medium uppercase tracking-wide text-sky-300">
            Annual upsell revenue
          </p>
          <p className="mt-2 text-lg font-semibold text-sky-100">
            {formatCurrency(annualUpsellRevenue, preset.currency)}
          </p>
          <p className="mt-1 text-xs text-sky-200/80">
            From in room recommendations for spa, dining, and other services.
          </p>
        </div>

        <div className="rounded-xl border border-[#e2c044] bg-[#e2c044]/10 p-4">
          <p className="text-sm font-medium uppercase tracking-wide text-[#e2c044]">
            Total estimated annual value
          </p>
          <p className="mt-2 text-xl font-bold text-yellow-100">
            {formatCurrency(totalAnnualValue, preset.currency)}
          </p>
          <p className="mt-1 text-xs text-[#e2c044]/80">
            About {formatCurrency(monthlyValue, preset.currency)} per month in combined savings and
            new revenue.
          </p>
        </div>
      </div>

      <div className="mt-6 border-t border-gray-800 pt-4 text-sm text-gray-400">
        <div className="flex  flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <p className="mt-4 sm:mt-0">
            This is a directional estimate, not a quote. Actual results depend on property size,
            adoption, and operations.
          </p>
          <NavLink
            href={`/contact-us?monthlySalary=${monthlySalary}&staffCount=${staffCount}&automationPercent=${automationPercent}&dailyRoomRevenue=${dailyRoomRevenue}&upsellPercent=${upsellPercent}&market=${selectedMarket}`}
            className={`w-auto text-sm rounded-full text-white ring-offset-2 cta-btn text-nowrap `}
          >
            Book a Demo
          </NavLink>
        </div>
      </div>
    </section>
  );
}
