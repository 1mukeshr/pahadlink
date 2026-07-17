const baseProps = {
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.75,
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
}

export const Icon = ({ children, className = '', size = 24, ...props }) => (
  <svg
    viewBox="0 0 24 24"
    width={size}
    height={size}
    className={className}
    aria-hidden="true"
    {...baseProps}
    {...props}
  >
    {children}
  </svg>
)

export const HomeIcon = (props) => (
  <Icon {...props}>
    <path d="m3 11 9-8 9 8" />
    <path d="M5 10v10a1 1 0 0 0 1 1h4v-6h4v6h4a1 1 0 0 0 1-1V10" />
  </Icon>
)

export const MountainIcon = (props) => (
  <Icon {...props}>
    <path d="m3 20 6.5-12 2.5 4.5L15 7l6 13H3z" />
    <path d="M8.2 20 12 12.5 14.8 20" />
  </Icon>
)

/** Hills / local-origin mark - multi-peak range for “From the hills” */
export const HillsIcon = (props) => (
  <Icon {...props}>
    <path d="M2 20h20" />
    <path d="m4 20 4.2-9 2.3 4.2L13.5 8l6.5 12" />
    <path d="m9.2 20 2.6-5.2 2.4 5.2" />
  </Icon>
)

export const MapPinIcon = (props) => (
  <Icon {...props}>
    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
    <circle cx="12" cy="10" r="3" />
  </Icon>
)

export const SearchIcon = (props) => (
  <Icon {...props}>
    <circle cx="11" cy="11" r="8" />
    <path d="m21 21-4.35-4.35" />
  </Icon>
)

export const LocateIcon = (props) => (
  <Icon {...props}>
    <circle cx="12" cy="12" r="3" />
    <path d="M12 2v3" />
    <path d="M12 19v3" />
    <path d="M2 12h3" />
    <path d="M19 12h3" />
  </Icon>
)

export const UserIcon = (props) => (
  <Icon {...props}>
    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
    <circle cx="12" cy="7" r="4" />
  </Icon>
)

export const UserPlusIcon = (props) => (
  <Icon {...props}>
    <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
    <circle cx="9" cy="7" r="4" />
    <path d="M19 8v6" />
    <path d="M22 11h-6" />
  </Icon>
)

export const LockIcon = (props) => (
  <Icon {...props}>
    <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
    <path d="M7 11V7a5 5 0 0 1 10 0v4" />
  </Icon>
)

export const EyeIcon = (props) => (
  <Icon {...props}>
    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
    <circle cx="12" cy="12" r="3" />
  </Icon>
)

export const EyeOffIcon = (props) => (
  <Icon {...props}>
    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" />
    <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" />
    <path d="M14.12 14.12a3 3 0 1 1-4.24-4.24" />
    <line x1="1" y1="1" x2="23" y2="23" />
  </Icon>
)

export const MailIcon = (props) => (
  <Icon {...props}>
    <rect x="3" y="5" width="18" height="14" rx="2" />
    <path d="m3 7 9 6 9-6" />
  </Icon>
)

export const PhoneIcon = (props) => (
  <Icon {...props}>
    <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z" />
  </Icon>
)

export const HeartIcon = (props) => (
  <Icon {...props}>
    <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
  </Icon>
)

export const CartIcon = (props) => (
  <Icon {...props}>
    <circle cx="9" cy="21" r="1" />
    <circle cx="20" cy="21" r="1" />
    <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
  </Icon>
)

export const ShieldIcon = (props) => (
  <Icon {...props}>
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
  </Icon>
)

export const TruckIcon = (props) => (
  <Icon {...props}>
    <rect x="1" y="3" width="15" height="13" />
    <path d="M16 8h4l3 3v5h-7V8z" />
    <circle cx="5.5" cy="18.5" r="2.5" />
    <circle cx="18.5" cy="18.5" r="2.5" />
  </Icon>
)

export const LeafIcon = (props) => (
  <Icon {...props}>
    <path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19 2c1 2 2 4.18 2 8 0 5.5-4.78 10-10 10z" />
    <path d="M2 21c0-3 1.85-5.36 5.08-6C9.5 14.52 12 13 13 12" />
  </Icon>
)

export const CheckCircleIcon = (props) => (
  <Icon {...props}>
    <circle cx="12" cy="12" r="10" />
    <path d="m9 12 2 2 4-4" />
  </Icon>
)

export const SpiceIcon = (props) => (
  <Icon {...props}>
    <path d="M12 2c1.5 3 4 5.5 4 9a4 4 0 0 1-8 0c0-3.5 2.5-6 4-9z" />
    <path d="M12 22v-4" />
    <path d="M8 18h8" />
  </Icon>
)

export const HoneyIcon = (props) => (
  <Icon {...props}>
    <path d="M8.5 3.5h7l1.8 3.8H6.7L8.5 3.5z" />
    <path d="M6.7 7.3h10.6v10.2a2 2 0 0 1-2 2H8.7a2 2 0 0 1-2-2V7.3z" />
    <path d="M9.6 12.2h4.8" />
    <path d="M9.6 15.2h4.8" />
  </Icon>
)

export const TeaIcon = (props) => (
  <Icon {...props}>
    <path d="M17 8h1a4 4 0 0 1 0 8h-1" />
    <path d="M3 8h14v9a4 4 0 0 1-4 4H7a4 4 0 0 1-4-4V8z" />
    <path d="M6 2v2" />
    <path d="M10 2v2" />
    <path d="M14 2v2" />
  </Icon>
)

export const JarIcon = (props) => (
  <Icon {...props}>
    <path d="M9 3h6l1 3H8l1-3z" />
    <path d="M8 6h8v13a2 2 0 0 1-2 2h-4a2 2 0 0 1-2-2V6z" />
    <path d="M10 10h4" />
    <path d="M10 14h4" />
  </Icon>
)

export const GrainIcon = (props) => (
  <Icon {...props}>
    <path d="M12 2v3" />
    <path d="M8.5 4.5 10 8" />
    <path d="M15.5 4.5 14 8" />
    <path d="M6 9l2.5 1.5" />
    <path d="M18 9l-2.5 1.5" />
    <ellipse cx="12" cy="14" rx="6" ry="7" />
    <path d="M8 14h8" />
    <path d="M9 17h6" />
  </Icon>
)

export const RiceIcon = (props) => (
  <Icon {...props}>
    <path d="M5 18c2-6 4-9 7-12 3 3 5 6 7 12" />
    <path d="M8 16h8" />
    <path d="M10 13h4" />
    <path d="M11 10h2" />
  </Icon>
)

export const DalIcon = (props) => (
  <Icon {...props}>
    <ellipse cx="8" cy="10" rx="2.5" ry="3" />
    <ellipse cx="16" cy="10" rx="2.5" ry="3" />
    <ellipse cx="12" cy="15" rx="2.5" ry="3" />
    <ellipse cx="8" cy="18" rx="2" ry="2.5" />
    <ellipse cx="16" cy="18" rx="2" ry="2.5" />
  </Icon>
)

export const BasketIcon = (props) => (
  <Icon {...props}>
    <path d="M5 10h14l-1.5 9H6.5L5 10z" />
    <path d="M9 6V4a3 3 0 0 1 6 0v2" />
    <path d="M9 14h6" />
  </Icon>
)

export const OrganicFoodIcon = (props) => (
  <Icon {...props}>
    <path d="M12 21c-4.2 0-7-2.7-7-6.2C5 9.2 9.2 5.4 12 3c2.8 2.4 7 6.2 7 11.8 0 3.5-2.8 6.2-7 6.2z" />
    <path d="M12 21V10.5" />
    <path d="M12 13.5c1.8-.7 3.2-2.2 4-4" />
  </Icon>
)

export const SpiritualIcon = (props) => (
  <Icon {...props}>
    <path d="M12 2.8c1.7 2.6 2.6 4.7 2.6 6.7a2.6 2.6 0 1 1-5.2 0c0-2 0.9-4.1 2.6-6.7z" />
    <path d="M8.2 21h7.6" />
    <path d="M9.2 21c0-2.1 1.3-3.5 2.8-4.7 1.5 1.2 2.8 2.6 2.8 4.7" />
    <path d="M7.5 16.2c1.2-.8 2.7-1.2 4.5-1.2s3.3.4 4.5 1.2" />
  </Icon>
)

export const ClothingIcon = (props) => (
  <Icon {...props}>
    <path d="M9.2 4h5.6l2 2.4L20 8.2l-2.4 2.2L15.8 9v11H8.2V9L6.4 10.4 4 8.2l3.2-1.8L9.2 4z" />
  </Icon>
)

export const HandicraftIcon = (props) => (
  <Icon {...props}>
    <path d="M5.5 10.5h13l-1.4 8.2a1.6 1.6 0 0 1-1.6 1.3H8.5a1.6 1.6 0 0 1-1.6-1.3L5.5 10.5z" />
    <path d="M9.5 10.5V7.2a2.5 2.5 0 0 1 5 0v3.3" />
    <path d="M9.8 14.5h4.4" />
  </Icon>
)

export const WellnessIcon = (props) => (
  <Icon {...props}>
    <path d="M11 21A8 8 0 0 1 9.5 6.2C15 5 17 3.5 19 2c1 2.2 2 4.5 2 8.2 0 5.8-4.5 10.8-10 10.8z" />
    <path d="M2 21c0-3.2 1.8-5.5 5-6.2" />
  </Icon>
)

export const SweetsIcon = (props) => (
  <Icon {...props}>
    <circle cx="12" cy="13" r="7" />
    <circle cx="12" cy="13" r="3.2" />
    <path d="M12 6.2v2.2" />
    <path d="M12 17.6v2.2" />
    <path d="M6.2 13h2.2" />
    <path d="M15.6 13h2.2" />
  </Icon>
)

export const GiftIcon = (props) => (
  <Icon {...props}>
    <rect x="4" y="10" width="16" height="11" rx="1.5" />
    <path d="M4 14h16" />
    <path d="M12 10v11" />
    <path d="M12 10c-2.1 0-3.4-1.4-3.4-2.8S10.1 4.6 12 6.8c1.9-2.2 3.4-1 3.4.4S14.1 10 12 10z" />
  </Icon>
)

export const WaterIcon = (props) => (
  <Icon {...props}>
    <path d="M12 3c4 5 7 8.5 7 12a7 7 0 0 1-14 0c0-3.5 3-7 7-12z" />
  </Icon>
)

export const PrasadIcon = (props) => (
  <Icon {...props}>
    <rect x="5" y="9" width="14" height="10" rx="2" />
    <path d="M8 9V7a4 4 0 0 1 8 0v2" />
    <path d="M12 13v3" />
    <path d="M9 15h6" />
  </Icon>
)

export const BeadIcon = (props) => (
  <Icon {...props}>
    <circle cx="8" cy="12" r="2.5" />
    <circle cx="12" cy="12" r="2.5" />
    <circle cx="16" cy="12" r="2.5" />
    <path d="M5.5 12h13" />
  </Icon>
)

export const PujaIcon = (props) => (
  <Icon {...props}>
    <path d="M12 4v4" />
    <path d="M8 8h8" />
    <path d="M10 8v10" />
    <path d="M14 8v10" />
    <path d="M7 18h10" />
    <path d="M9 12h6" />
  </Icon>
)

export const IncenseIcon = (props) => (
  <Icon {...props}>
    <path d="M12 20v-8" />
    <path d="M10.5 12c0-2 1-3.5 1.5-5.5.5 2 1.5 3.5 1.5 5.5" />
    <path d="M13.5 12c0-2 1-3.5 1.5-5.5.5 2 1.5 3.5 1.5 5.5" />
    <path d="M9 20h6" />
  </Icon>
)

export const HatIcon = (props) => (
  <Icon {...props}>
    <path d="M4 14h16" />
    <path d="M6 14c0-4 2.5-6 6-6s6 2 6 6" />
    <path d="M10 8V6a2 2 0 0 1 4 0v2" />
  </Icon>
)

export const ShawlIcon = (props) => (
  <Icon {...props}>
    <path d="M6 6h12l2 4v10H4V10l2-4z" />
    <path d="M8 10h8" />
    <path d="M8 14h8" />
    <path d="M8 18h8" />
  </Icon>
)

export const DressIcon = (props) => (
  <Icon {...props}>
    <path d="M9 4h6l2 4v12H7V8l2-4z" />
    <path d="M10 10h4" />
    <path d="M10 14h4" />
  </Icon>
)

export const FabricIcon = (props) => (
  <Icon {...props}>
    <rect x="4" y="6" width="16" height="12" rx="2" />
    <path d="M4 10h16" />
    <path d="M4 14h16" />
    <path d="M8 6v12" />
    <path d="M16 6v12" />
  </Icon>
)

export const WoodIcon = (props) => (
  <Icon {...props}>
    <path d="M8 8h8v12H8z" />
    <path d="M10 8V5h4v3" />
    <path d="M10 12h4" />
    <path d="M10 16h4" />
  </Icon>
)

export const BambooIcon = (props) => (
  <Icon {...props}>
    <path d="M9 4v16" />
    <path d="M15 4v16" />
    <path d="M7 8h4" />
    <path d="M13 12h4" />
    <path d="M7 16h4" />
    <path d="M13 20h4" />
  </Icon>
)

export const CopperIcon = (props) => (
  <Icon {...props}>
    <path d="M7 9h10l1 9H6l1-9z" />
    <path d="M9 9V6h6v3" />
    <path d="M8 14h8" />
  </Icon>
)

export const HandmadeIcon = (props) => (
  <Icon {...props}>
    <path d="M8 12c0-3 1.5-5 4-5s4 2 4 5" />
    <path d="M6 12h12v8H6z" />
    <path d="M10 16h4" />
  </Icon>
)

export const BottleIcon = (props) => (
  <Icon {...props}>
    <path d="M10 4h4v3h1l1 13H8l1-13h1V4z" />
    <path d="M11 10h2" />
  </Icon>
)

export const SoapIcon = (props) => (
  <Icon {...props}>
    <rect x="6" y="9" width="12" height="9" rx="2" />
    <path d="M9 9c0-2 1.5-3 3-3s3 1 3 3" />
    <path d="M9 14h6" />
  </Icon>
)

export const CosmeticIcon = (props) => (
  <Icon {...props}>
    <circle cx="12" cy="10" r="4" />
    <path d="M8 14h8v6H8z" />
    <path d="M10 17h4" />
  </Icon>
)

export const SnackIcon = (props) => (
  <Icon {...props}>
    <path d="M5 11h14l-1.5 8H6.5L5 11z" />
    <path d="M9 7V5a3 3 0 0 1 6 0v2" />
    <path d="M9 15h6" />
  </Icon>
)

export const ChevronDownIcon = (props) => (
  <Icon strokeWidth={2.35} {...props}>
    <path d="m6 9 6 6 6-6" />
  </Icon>
)

export const ChevronRightIcon = (props) => (
  <Icon strokeWidth={2.35} {...props}>
    <path d="m9 6 6 6-6 6" />
  </Icon>
)

export const ChevronLeftIcon = (props) => (
  <Icon strokeWidth={2.35} {...props}>
    <path d="m15 6-6 6 6 6" />
  </Icon>
)

/** Solid dropdown caret - clearer at header / pincode sizes */
export const DropdownIcon = ({ className = '', size = 14, ...props }) => (
  <svg
    viewBox="0 0 24 24"
    width={size}
    height={size}
    className={className}
    aria-hidden="true"
    fill="currentColor"
    {...props}
  >
    <path d="M7.2 9.25a1.15 1.15 0 0 1 1.63 0L12 12.42l3.17-3.17a1.15 1.15 0 1 1 1.63 1.63l-3.98 3.98a1.15 1.15 0 0 1-1.63 0L7.2 10.88a1.15 1.15 0 0 1 0-1.63z" />
  </svg>
)

export const ArrowRightIcon = (props) => (
  <Icon strokeWidth={2} {...props}>
    <path d="M5 12h14" />
    <path d="m13 6 6 6-6 6" />
  </Icon>
)

export const ArrowLeftIcon = (props) => (
  <Icon strokeWidth={2.1} {...props}>
    <path d="M19 12H5" />
    <path d="m11 5-7 7 7 7" />
  </Icon>
)

export const CloseIcon = (props) => (
  <Icon {...props}>
    <path d="M18 6 6 18" />
    <path d="m6 6 12 12" />
  </Icon>
)

export const TrashIcon = (props) => (
  <Icon {...props}>
    <path d="M3 6h18" />
    <path d="M8 6V4h8v2" />
    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6" />
    <path d="M10 11v6" />
    <path d="M14 11v6" />
  </Icon>
)

export const PackageIcon = (props) => (
  <Icon {...props}>
    <path d="M21 8.5 12 3 3 8.5v7L12 21l9-5.5v-7z" />
    <path d="M12 12v9" />
    <path d="M3 8.5 12 12l9-3.5" />
    <path d="m7.5 6.2 9 5.3" />
  </Icon>
)

export const LogOutIcon = (props) => (
  <Icon {...props}>
    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
    <path d="M16 17l5-5-5-5" />
    <path d="M21 12H9" />
  </Icon>
)

export const ChatIcon = (props) => (
  <Icon {...props}>
    <path d="M5 6.75A2.75 2.75 0 0 1 7.75 4h8.5A2.75 2.75 0 0 1 19 6.75v6.5A2.75 2.75 0 0 1 16.25 16H12l-4.25 3.25V16H7.75A2.75 2.75 0 0 1 5 13.25v-6.5z" />
    <path d="M8.5 9.25h7" />
    <path d="M8.5 12.25h4.5" />
  </Icon>
)

export const ArrowUpIcon = (props) => (
  <Icon {...props}>
    <path d="m12 19 0-14" />
    <path d="m5 12 7-7 7 7" />
  </Icon>
)

export const RefreshIcon = (props) => (
  <Icon {...props}>
    <path d="M3 12a9 9 0 0 1 15.5-6.4" />
    <path d="M21 3v6h-6" />
    <path d="M21 12a9 9 0 0 1-15.5 6.4" />
    <path d="M3 21v-6h6" />
  </Icon>
)

export const WhatsAppIcon = ({ size = 18, className = '' }) => (
  <svg
    viewBox="0 0 24 24"
    width={size}
    height={size}
    className={className}
    aria-hidden="true"
    fill="currentColor"
  >
    <path d="M20.5 3.5A11.8 11.8 0 0 0 12.05 0C5.5 0 .2 5.3.2 11.85c0 2.1.55 4.1 1.6 5.9L0 24l6.4-1.7a11.8 11.8 0 0 0 5.65 1.45h.05c6.55 0 11.85-5.3 11.85-11.85 0-3.17-1.23-6.15-3.45-8.4zm-8.45 18.2h-.04a9.8 9.8 0 0 1-5-1.37l-.36-.21-3.8 1 1.02-3.7-.24-.38a9.8 9.8 0 0 1-1.5-5.22c0-5.42 4.42-9.83 9.85-9.83 2.63 0 5.1 1.02 6.96 2.88a9.76 9.76 0 0 1 2.88 6.95c0 5.42-4.42 9.88-9.77 9.88zm5.38-7.37c-.3-.15-1.75-.86-2.02-.96-.27-.1-.47-.15-.67.15-.2.3-.77.96-.94 1.16-.17.2-.35.22-.64.07-.3-.15-1.25-.46-2.38-1.47-.88-.78-1.47-1.75-1.64-2.04-.17-.3-.02-.46.13-.6.13-.13.3-.35.44-.52.15-.17.2-.3.3-.5.1-.2.05-.37-.02-.52-.08-.15-.67-1.6-.92-2.2-.24-.57-.48-.5-.67-.5h-.57c-.2 0-.52.07-.8.37-.27.3-1.04 1.02-1.04 2.48s1.07 2.88 1.22 3.08c.15.2 2.1 3.2 5.08 4.48.71.3 1.26.49 1.69.63.71.23 1.36.2 1.87.12.57-.09 1.75-.72 2-1.4.25-.7.25-1.29.17-1.41-.07-.12-.27-.2-.57-.35z" />
  </svg>
)

export const InstagramIcon = ({ size = 18, className = '' }) => (
  <svg
    viewBox="0 0 24 24"
    width={size}
    height={size}
    className={className}
    aria-hidden="true"
    fill="currentColor"
  >
    <path d="M12 2.2c3.2 0 3.6 0 4.9.1 1.2.1 1.9.2 2.4.5.6.2 1 .5 1.5 1 .4.4.7.9 1 1.5.2.5.4 1.2.5 2.4.1 1.3.1 1.7.1 4.9s0 3.6-.1 4.9c-.1 1.2-.2 1.9-.5 2.4-.2.6-.5 1-1 1.5-.4.4-.9.7-1.5 1-.5.2-1.2.4-2.4.5-1.3.1-1.7.1-4.9.1s-3.6 0-4.9-.1c-1.2-.1-1.9-.2-2.4-.5-.6-.2-1-.5-1.5-1-.4-.4-.7-.9-1-1.5-.2-.5-.4-1.2-.5-2.4C2.2 15.6 2.2 15.2 2.2 12s0-3.6.1-4.9c.1-1.2.2-1.9.5-2.4.2-.6.5-1 1-1.5.4-.4.9-.7 1.5-1 .5-.2 1.2-.4 2.4-.5C8.4 2.2 8.8 2.2 12 2.2m0-2.2C8.7 0 8.3 0 7 0.1 5.7.2 4.8.4 4 .8c-.9.3-1.6.8-2.3 1.5C1 3.1.6 3.8.3 4.7.1 5.5-.1 6.4 0 7.7.1 9 .1 9.4.1 12s0 3 .1 4.3c.1 1.3.3 2.2.7 3 .3.9.8 1.6 1.5 2.3.7.7 1.4 1.1 2.3 1.5.8.3 1.7.5 3 .7C8.3 24 8.7 24 12 24s3.7 0 5-.1c1.3-.1 2.2-.3 3-.7.9-.3 1.6-.8 2.3-1.5.7-.7 1.1-1.4 1.5-2.3.3-.8.5-1.7.7-3 .1-1.3.1-1.7.1-5s0-3.7-.1-5c-.1-1.3-.3-2.2-.7-3-.3-.9-.8-1.6-1.5-2.3C20.6 1.6 19.9 1.1 19 .8c-.8-.3-1.7-.5-3-.7C15.7 0 15.3 0 12 0z" />
    <path d="M12 5.8A6.2 6.2 0 1 0 12 18.2 6.2 6.2 0 0 0 12 5.8zm0 10.2a4 4 0 1 1 0-8 4 4 0 0 1 0 8z" />
    <circle cx="18.4" cy="5.6" r="1.4" />
  </svg>
)

export const FacebookIcon = ({ size = 18, className = '' }) => (
  <svg
    viewBox="0 0 24 24"
    width={size}
    height={size}
    className={className}
    aria-hidden="true"
    fill="currentColor"
  >
    <path d="M22 12.1C22 6.5 17.5 2 11.9 2S2 6.5 2 12.1c0 5 3.7 9.1 8.4 9.9v-7H8.1v-2.9h2.3V9.9c0-2.3 1.4-3.5 3.4-3.5.9 0 1.9.1 1.9.1v2.4h-1.2c-1.2 0-1.5.7-1.5 1.5v1.8h2.7l-.4 2.9h-2.3v7C18.3 21.2 22 17.1 22 12.1z" />
  </svg>
)

export const YoutubeIcon = ({ size = 18, className = '' }) => (
  <svg
    viewBox="0 0 24 24"
    width={size}
    height={size}
    className={className}
    aria-hidden="true"
    fill="currentColor"
  >
    <path d="M23.5 6.2a3 3 0 0 0-2.1-2.1C19.5 3.5 12 3.5 12 3.5s-7.5 0-9.4.6A3 3 0 0 0 .5 6.2 31.4 31.4 0 0 0 0 12a31.4 31.4 0 0 0 .5 5.8 3 3 0 0 0 2.1 2.1c1.9.6 9.4.6 9.4.6s7.5 0 9.4-.6a3 3 0 0 0 2.1-2.1A31.4 31.4 0 0 0 24 12a31.4 31.4 0 0 0-.5-5.8zM9.8 15.5v-7L16 12l-6.2 3.5z" />
  </svg>
)

/** Cash on delivery - banknote */
export const CodIcon = ({ size = 22, className = '' }) => (
  <svg
    viewBox="0 0 24 24"
    width={size}
    height={size}
    className={className}
    aria-hidden="true"
    fill="none"
  >
    <rect x="2" y="6" width="20" height="12" rx="2" fill="#E8F5E9" stroke="#2E7D32" strokeWidth="1.4" />
    <circle cx="12" cy="12" r="3.2" fill="#fff" stroke="#2E7D32" strokeWidth="1.3" />
    <path
      d="M12 9.8v4.4M10.6 11.2c.3-.5.8-.8 1.4-.8.9 0 1.5.5 1.5 1.2s-.6 1.1-1.5 1.1c-.6 0-1.1-.2-1.4-.6"
      stroke="#2E7D32"
      strokeWidth="1.25"
      strokeLinecap="round"
    />
    <circle cx="5.5" cy="12" r="1" fill="#81C784" />
    <circle cx="18.5" cy="12" r="1" fill="#81C784" />
  </svg>
)

/** UPI - phone pay mark */
export const UpiIcon = ({ size = 22, className = '' }) => (
  <svg
    viewBox="0 0 24 24"
    width={size}
    height={size}
    className={className}
    aria-hidden="true"
    fill="none"
  >
    <rect x="6.5" y="2.5" width="11" height="19" rx="2.2" fill="#F3E8FF" stroke="#6A1B9A" strokeWidth="1.4" />
    <rect x="9" y="4.5" width="6" height="1.2" rx="0.6" fill="#CE93D8" />
    <path d="M9.2 10.2h5.6" stroke="#097939" strokeWidth="1.6" strokeLinecap="round" />
    <path d="M9.2 13h5.6" stroke="#ED752E" strokeWidth="1.6" strokeLinecap="round" />
    <path d="M9.2 15.8h3.6" stroke="#097939" strokeWidth="1.6" strokeLinecap="round" />
    <circle cx="12" cy="19.2" r="0.9" fill="#6A1B9A" />
  </svg>
)

/** Credit / debit card */
export const CardPayIcon = ({ size = 22, className = '' }) => (
  <svg
    viewBox="0 0 24 24"
    width={size}
    height={size}
    className={className}
    aria-hidden="true"
    fill="none"
  >
    <rect x="2" y="5" width="20" height="14" rx="2.2" fill="#E3F2FD" stroke="#1565C0" strokeWidth="1.4" />
    <rect x="2" y="8.2" width="20" height="3.2" fill="#1565C0" />
    <rect x="4.5" y="14" width="5.5" height="1.6" rx="0.4" fill="#90CAF9" />
    <rect x="11.5" y="14" width="3.2" height="1.6" rx="0.4" fill="#90CAF9" />
    <rect x="16" y="14" width="3.5" height="1.6" rx="0.4" fill="#64B5F6" />
  </svg>
)

export const GridIcon = (props) => (
  <Icon {...props}>
    <rect x="3" y="3" width="7" height="7" />
    <rect x="14" y="3" width="7" height="7" />
    <rect x="3" y="14" width="7" height="7" />
    <rect x="14" y="14" width="7" height="7" />
  </Icon>
)

export const StarIcon = ({ filled = true, className = '', size = 16 }) => (
  <svg
    viewBox="0 0 24 24"
    width={size}
    height={size}
    className={className}
    aria-hidden="true"
  >
    <path
      d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"
      fill={filled ? 'currentColor' : 'none'}
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinejoin="round"
    />
  </svg>
)

export const StarRating = ({ rating = 5, max = 5, className = '' }) => (
  <div className={`star-rating ${className}`.trim()} aria-hidden="true">
    {Array.from({ length: max }, (_, i) => (
      <StarIcon key={i} filled={i < rating} size={16} />
    ))}
  </div>
)

export const GoogleIcon = (props) => (
  <svg viewBox="0 0 24 24" width={20} height={20} aria-hidden="true" {...props}>
    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" />
    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
  </svg>
)

const categoryIcons = {
  spices: SpiceIcon,
  honey: HoneyIcon,
  tea: TeaIcon,
  pickles: JarIcon,
  grains: GrainIcon,
  handmade: BasketIcon,
  'organic-food': OrganicFoodIcon,
  'honey-natural': HoneyIcon,
  spiritual: SpiritualIcon,
  clothing: ClothingIcon,
  handicrafts: HandicraftIcon,
  'snacks-sweets': SweetsIcon,
  'gift-hampers': GiftIcon,
}

export const CategoryIcon = ({ name, className = '', size = 24 }) => {
  const IconComponent = categoryIcons[name] || SpiceIcon
  return <IconComponent className={className} size={size} strokeWidth={1.85} />
}

const subcategoryIcons = {
  grain: GrainIcon,
  rice: RiceIcon,
  dal: DalIcon,
  honey: HoneyIcon,
  tea: TeaIcon,
  jar: JarIcon,
  spice: SpiceIcon,
  leaf: LeafIcon,
  water: WaterIcon,
  prasad: PrasadIcon,
  bead: BeadIcon,
  puja: PujaIcon,
  incense: IncenseIcon,
  spiritual: SpiritualIcon,
  hat: HatIcon,
  shawl: ShawlIcon,
  dress: DressIcon,
  fabric: FabricIcon,
  clothing: ClothingIcon,
  wood: WoodIcon,
  bamboo: BambooIcon,
  copper: CopperIcon,
  handmade: HandmadeIcon,
  handicraft: HandicraftIcon,
  sweet: SweetsIcon,
  sweets: SweetsIcon,
  snack: SnackIcon,
  gift: GiftIcon,
  basket: BasketIcon,
}

const resolveSubcategoryIcon = (name, categoryId) => {
  const text = name.toLowerCase()

  if (/gangajal/.test(text)) return 'water'
  if (/prasad|box/.test(text)) return 'prasad'
  if (/honey/.test(text)) return 'honey'
  if (/tea/.test(text)) return 'tea'
  if (/jam|pickle/.test(text)) return 'jar'
  if (/spice/.test(text)) return 'spice'
  if (/rice/.test(text)) return 'rice'
  if (/rajma|gahat|bhatt|dal/.test(text)) return 'dal'
  if (/mandua|jhangora|mil/.test(text)) return 'grain'
  if (/rudraksha/.test(text)) return 'bead'
  if (/puja/.test(text)) return 'puja'
  if (/incense/.test(text)) return 'incense'
  if (/topi/.test(text)) return 'hat'
  if (/shawl/.test(text)) return 'shawl'
  if (/dress/.test(text)) return 'dress'
  if (/handwoven|fabric/.test(text)) return 'fabric'
  if (/wooden|wood/.test(text)) return 'wood'
  if (/bamboo|ringaal/.test(text)) return 'bamboo'
  if (/copper/.test(text)) return 'copper'
  if (/handmade|handcraft/.test(text)) return 'handmade'
  if (/mithai|singori|sweet/.test(text)) return 'sweet'
  if (/snack|rus/.test(text)) return 'snack'
  if (/hamper|gift/.test(text)) return 'gift'

  const categoryFallback = {
    'organic-food': 'grain',
    'honey-natural': 'honey',
    spiritual: 'spiritual',
    clothing: 'clothing',
    handicrafts: 'handicraft',
    'snacks-sweets': 'sweet',
    'gift-hampers': 'gift',
  }

  return categoryFallback[categoryId] || 'leaf'
}

export const SubcategoryIcon = ({ icon, name, categoryId, className = '', size = 18 }) => {
  const iconKey = icon || resolveSubcategoryIcon(name, categoryId)
  const IconComponent = subcategoryIcons[iconKey] || LeafIcon
  return <IconComponent className={className} size={size} />
}
