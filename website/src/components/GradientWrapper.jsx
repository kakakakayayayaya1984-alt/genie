const GradientWrapper = ({ children, ...props }) => (
  <div {...props} className={`relative ${props.className || ''}`}>
    <div
      className={`absolute m-auto blur-[160px] ${props.wrapperclassname || ''}`}
      style={{
        background: 'linear-gradient(180deg, #161032 0%, #161032 10%, #E2c044 100%)',
      }}
    ></div>
    <div className="relative">{children}</div>
  </div>
);

export default GradientWrapper;
