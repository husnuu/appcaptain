/**
 * Single source of truth for icons across all GetYourBoat frontends.
 *
 * Icon library: Font Awesome Free. Screens must import icons + the renderer
 * from "@getyourboat/ui", never directly from @fortawesome/*.
 *
 * `autoAddCss = false` disables Font Awesome's runtime CSS injection; apps
 * import "@fortawesome/fontawesome-svg-core/styles.css" once in their layout
 * to avoid the flash-of-unstyled-icon (FOUC) on SSR.
 */
import { config, type IconDefinition } from "@fortawesome/fontawesome-svg-core";

config.autoAddCss = false;

export { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
export type { IconDefinition };

export {
  faCheck,
  faChevronDown,
  faChevronRight,
  faArrowLeft,
  faArrowRight,
  faAnchor,
  faShip,
  faClock,
  faSun,
  faMoon,
  faCalendarDays,
  faPaperPlane,
  faPenToSquare,
  faBolt,
  faTrash,
  faEye,
  faSpinner,
  faXmark,
  faCircleInfo,
  faCircleCheck,
  faTriangleExclamation,
  faCircleXmark,
  faBell,
  faGlobe,
  faCircleQuestion,
  faGaugeHigh,
  faRightFromBracket,
  faComments,
  faPercent,
  faWallet,
  faScaleBalanced,
  faGear,
  faImage,
  faFile,
  faWrench,
  faLightbulb,
  faUsers,
  faRulerHorizontal,
  faLocationDot,
  faLocationCrosshairs,
  faMapLocationDot,
  faSatellite,
  faStar,
  faGaugeSimpleHigh,
  faPlus,
  faMinus,
  faLock,
  faArrowTrendUp,
  faLayerGroup,
  faHouse,
  faTag,
  faMagnifyingGlass,
  faShieldHalved,
  faRightToBracket,
  faArrowRightFromBracket,
  faCalendarCheck,
  faEnvelope,
  faPhone,
} from "@fortawesome/free-solid-svg-icons";
