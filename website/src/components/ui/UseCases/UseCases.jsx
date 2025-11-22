import SectionWrapper from '@/src/components/SectionWrapper';
import ActiveRequests from '@/public/images/active-requests-concise.png';
import BookingConverastion from '@/public/images/book-room-conversation.png';
import InRoomTablet from '@/public/images/in-room-tablet.png';
import EnlargeableImage from '../EnlargeableImage';

const UseCases = () => {
  const features = [
    {
      title: 'Front Desk Overview',
      desc: 'One unified dashboard for all guest queries — staying or non-staying — and every operational request, from housekeeping and room service to maintenance and facilities. ',
      img: ActiveRequests,
    },
    {
      title: 'Hotel Enquiries and Call Handling',
      desc: 'Room Mitra answers phone calls instantly, handles queries about availability, pricing, and routes calls when needed.',
      img: BookingConverastion,
    },
    {
      title: 'In-Room Service for Staying Guests',
      desc: 'Lets guests request housekeeping, room service, concierge, or maintenance using tablet or voice.',
      img: InRoomTablet,
    },
  ];
  return (
    <SectionWrapper id="use-cases">
      <div className="custom-screen">
        <div className="max-w-xl mx-auto text-center">
          <h2 className="text-white text-3xl font-semibold sm:text-4xl">
            One AI. Three High-Impact Hospitality Use Cases
          </h2>
        </div>
        <div className="mt-12">
          <ul className="space-y-8 gap-x-6 sm:flex sm:space-y-0">
            {features.map((item, idx) => (
              <li
                className="flex-1 flex flex-col justify-between border border-gray-800 rounded-2xl"
                key={idx}
                style={{
                  background:
                    'radial-gradient(141.61% 141.61% at 29.14% -11.49%, rgba(203, 213, 225, 0.15) 0%, rgba(203, 213, 225, 0) 57.72%)',
                }}
              >
                <div className="p-8">
                  <h3 className="text-gray-50 text-xl font-semibold">{item.title}</h3>
                  <p className="mt-3 sm:text-sm md:text-base text-gray-300">{item.desc}</p>
                </div>
                <div className="pl-8">
                  <EnlargeableImage
                    src={item.img}
                    className="w-full ml-auto rounded-md"
                    alt={item.title}
                  />
                </div>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </SectionWrapper>
  );
};

export default UseCases;
