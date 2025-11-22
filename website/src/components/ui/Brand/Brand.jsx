import Image from 'next/image';

const Brand = ({ ...props }) => (
  <Image
    src="/images/roommitra-logo.svg"
    alt="Room Mitra logo"
    {...props}
    width={130}
    height={38}
    priority
  />
);
export default Brand;
