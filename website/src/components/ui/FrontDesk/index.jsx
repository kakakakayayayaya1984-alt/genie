import GradientWrapper from '@/src/components/GradientWrapper';
import Image from 'next/image';
import NavLink from '../NavLink';
import LayoutEffect from '@/src/components/LayoutEffect';
import bgPattern from '@/public/images/bg-pattern.webp';
import conversation from '@/public/images/room-service-conversation.png';
import EnlargeableImage from '../EnlargeableImage';

const FrontDesk = () => (
  <section id="ai-front-desk">
    <GradientWrapper wrapperclassname="max-w-xs h-[13rem] top-12 inset-0">
      <div className="custom-screen py-28 relative">
        <LayoutEffect
          className="duration-1000 delay-300"
          isInviewState={{
            trueState: 'opacity-100',
            falseState: 'opacity-0 translate-y-6',
          }}
        >
          <div className="relative z-10">
            <div className="flex flex-col sm:flex-row">
              <div className="max-w-xl">
                <h2 className="text-gray-50 text-3xl font-semibold sm:text-4xl">
                  AI Front Desk When Your Team is Busy or Off Duty
                </h2>

                <p className="text-white text-xl mt-10">Guest support</p>

                <div className="grid grid-cols-2 gap-2 py-6">
                  <div className="flex items-center gap-2">
                    <span className="h-2 w-2 rounded-full bg-emerald-500/70" />
                    <span className="text-gray-300">Greets callers professionally</span>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="h-2 w-2 rounded-full bg-emerald-500/70" />
                    <span className="text-gray-300">Answers pricing questions</span>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="h-2 w-2 rounded-full bg-emerald-500/70" />
                    <span className="text-gray-300">Shares room info</span>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="h-2 w-2 rounded-full bg-emerald-500/70" />
                    <span className="text-gray-300">Check bookings & availability</span>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="h-2 w-2 rounded-full bg-emerald-500/70" />
                    <span className="text-gray-300">Routes calls to staff</span>
                  </div>
                </div>

                <p className="text-white text-xl">In-room</p>

                <div className="grid grid-cols-2 gap-2 py-6">
                  <div className="flex items-center gap-2">
                    <span className="h-2 w-2 rounded-full bg-emerald-500/70" />
                    <span className="text-gray-300">Handles food orders</span>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="h-2 w-2 rounded-full bg-emerald-500/70" />
                    <span className="text-gray-300">Housekeeping requests</span>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="h-2 w-2 rounded-full bg-emerald-500/70" />
                    <span className="text-gray-300">Shares amenities info</span>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="h-2 w-2 rounded-full bg-emerald-500/70" />
                    <span className="text-gray-300">Calls maintenance</span>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="h-2 w-2 rounded-full bg-emerald-500/70" />
                    <span className="text-gray-300">Wake-up calls</span>
                  </div>
                </div>
              </div>
              <div className="grid items-end mx-auto justify-items-end text-right">
                <EnlargeableImage
                  className=" rounded-lg border border-0"
                  src={conversation}
                  alt="conversation log"
                  height={450}
                />
              </div>

              <div></div>
            </div>

            <div className="mt-5 flex justify-center font-medium text-sm">
              <NavLink
                href="/contact-us"
                className="flex items-center text-white cta-btn active:bg-purple-700 "
              >
                Book a Demo
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                  className="w-5 h-5"
                >
                  <path
                    fillRule="evenodd"
                    d="M7.21 14.77a.75.75 0 01.02-1.06L11.168 10 7.23 6.29a.75.75 0 111.04-1.08l4.5 4.25a.75.75 0 010 1.08l-4.5 4.25a.75.75 0 01-1.06-.02z"
                    clipRule="evenodd"
                  />
                </svg>
              </NavLink>
            </div>
          </div>
        </LayoutEffect>
        <Image
          src={bgPattern}
          className="w-full h-full object-cover m-auto absolute inset-0 pointer-events-none"
          alt="Background pattern"
        />
      </div>
    </GradientWrapper>
  </section>
);

export default FrontDesk;
