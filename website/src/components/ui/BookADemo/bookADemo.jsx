import GradientWrapper from '../../GradientWrapper';
import LayoutEffect from '../../LayoutEffect';
import SectionWrapper from '../../SectionWrapper';
import NavLink from '../NavLink';

export default function BookADemo() {
  return (
    <SectionWrapper id="book-a-demo" className="custom-screen">
      <GradientWrapper wrapperclassname="max-w-xs h-[13rem] top-12 inset-0">
        <LayoutEffect
          className="duration-1000 delay-300"
          isInviewState={{
            trueState: 'opacity-100',
            falseState: 'opacity-0 translate-y-6',
          }}
        >
          <div className="border border-gray-800/30 bg-gray-800/30 shadow py-10 px-10 rounded-lg ">
            <div className="text-4xl font-bold text-gray-300">
              Ready to improve your Hotel efficiency?
            </div>

            <div className="text-lg text-gray-300/80 py-3">
              Connect with our team for a personalized demo and see how Room Mitra can transform
              your hotel operations.
            </div>

            <div className="py-5">
              <NavLink
                href="/contact-us"
                className="flex items-center text-white cta-btn active:bg-purple-700 w-fit text-sm"
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
      </GradientWrapper>
    </SectionWrapper>
  );
}
