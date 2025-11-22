'use client';

import LayoutEffect from '@/src/components/LayoutEffect';
import SectionWrapper from '@/src/components/SectionWrapper';
import NavLink from '../NavLink';
import { useMemo, useState } from 'react';

const Pricing = () => {
  const plans = {
    india: [
      {
        name: 'Starter',
        desc: 'In-room tablet + voice.',
        price: 500,
        isMostPop: false,
        features: [
          'In-room tablet to handle guest requests',
          'Voice agent for room service, housekeeping, and amenities',
          'Request tracking dashboard',
          'SLA monitoring and staff assignment',
          'In-room upsell cards (spa, dining, upgrades)',
          'Basic analytics and request history',
        ],
      },
      {
        name: 'Growth',
        desc: (
          <>
            <p>Starter plus the AI Phone Agent</p>
          </>
        ),
        price: 750,
        isMostPop: true,
        features: [
          'AI Phone Agent answers calls instantly',
          'Handles bookings, pricing and FAQs',
          'Lead capture and call routing to staff',
          'Reduces front-desk workload',
          '24/7 voice coverage for prospects and guests',
          'Call analytics and peak-hour insights',
        ],
      },
      {
        name: 'Enterprise',
        desc: 'All Features + Custom Integrations',
        price: '1,250',
        isMostPop: false,
        features: [
          'Custom PMS, POS, and CRM integrations',
          'Multi-property management',
          'Workflow automation tailored to your SOPs',
          'Priority support and onboarding',
          'Advanced analytics dashboards',
          'White-labeling and custom voice options',
        ],
      },
    ],
    global: [
      {
        name: 'Starter',
        desc: 'In-room tablet + voice.',
        price: 12,
        isMostPop: false,
        features: [
          'In-room tablet to handle guest requests',
          'Voice agent for room service, housekeeping, and amenities',
          'Request tracking dashboard',
          'SLA monitoring and staff assignment',
          'In-room upsell cards (spa, dining, upgrades)',
          'Basic analytics and request history',
        ],
      },
      {
        name: 'Growth',
        desc: (
          <>
            <p>Starter plus the AI Phone Agent</p>
          </>
        ),
        price: 18,
        isMostPop: true,
        features: [
          'AI Phone Agent answers calls instantly',
          'Handles bookings, pricing and FAQs',
          'Lead capture and call routing to staff',
          'Reduces front-desk workload',
          '24/7 voice coverage for prospects and guests',
          'Call analytics and peak-hour insights',
        ],
      },
      {
        name: 'Enterprise',
        desc: 'All Features + Custom Integrations',
        price: 30,
        isMostPop: false,
        features: [
          'Custom PMS, POS, and CRM integrations',
          'Multi-property management',
          'Workflow automation tailored to your SOPs',
          'Priority support and onboarding',
          'Advanced analytics dashboards',
          'White-labeling and custom voice options',
        ],
      },
    ],
  };

  const [selectedMarket, setSelectedMarket] = useState('global');
  const preset = useMemo(() => plans[selectedMarket], [selectedMarket]);

  const mostPopPricingBg =
    'radial-gradient(130.39% 130.39% at 51.31% -0.71%, #1F2937 0%, rgba(31, 41, 55, 0) 100%)';

  return (
    <SectionWrapper id="pricing" className="custom-screen">
      <div className="relative max-w-xl mx-auto text-center">
        <h2 className="text-gray-50 text-3xl font-semibold sm:text-4xl">
          Find a plan to power your hotel
        </h2>
        {/* Market toggle */}
        <div className="flex mx-auto w-fit mt-10">
          <div className="flex w-fit items-center gap-2 rounded-full border border-gray-700 bg-gray-800 px-2 py-1 text-xs">
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
      </div>
      <LayoutEffect
        className="duration-1000 delay-300"
        isInviewState={{
          trueState: 'opacity-100',
          falseState: 'opacity-0',
        }}
      >
        <div className="mt-16 justify-center gap-6 sm:grid sm:grid-cols-2 sm:space-y-0 lg:grid-cols-3">
          {preset.map((item, idx) => (
            <div
              key={idx}
              className={`relative flex-1 flex items-stretch flex-col rounded-xl border border-gray-800 mt-6 sm:mt-0 ${item.isMostPop ? 'border border-purple-500' : ''}`}
              style={{
                backgroundImage: item.isMostPop ? mostPopPricingBg : '',
              }}
            >
              <div className="p-8 space-y-4 border-b border-gray-800 text-center">
                <span className="text-purple-600 font-medium">{item.name}</span>
                <div className="text-gray-50 text-3xl font-semibold">
                  {selectedMarket === 'india' ? '₹' : '$'}
                  {item.price}{' '}
                  <span className="text-xl text-gray-400 font-normal">/ room / mo</span>
                </div>
                <div className="text-gray-200">{item.desc}</div>
              </div>
              <div className="p-8">
                <ul className="space-y-3">
                  {item.features.map((featureItem, idx) => (
                    <li key={idx} className="flex items-center gap-5 text-sm text-gray-300">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-5 w-5 text-indigo-600"
                        viewBox="0 0 20 20"
                        fill="currentColor"
                      >
                        <path
                          fillRule="evenodd"
                          d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                          clipRule="evenodd"
                        ></path>
                      </svg>
                      {featureItem}
                    </li>
                  ))}
                </ul>
                <div className="pt-8  bottom-0 inset-0 items-center flex">
                  <NavLink
                    href={`/contact-us?plan=${item.name}&market=${selectedMarket}`}
                    className={`w-full text-sm rounded-full text-white ring-offset-2 focus:ring ${item.isMostPop ? 'cta-btn' : 'bg-gray-800 hover:bg-gray-700 ring-gray-800'}`}
                  >
                    Get Started
                  </NavLink>
                </div>
              </div>
            </div>
          ))}
        </div>
      </LayoutEffect>
    </SectionWrapper>
  );
};

export default Pricing;
