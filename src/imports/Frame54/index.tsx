import svgPaths from "./svg-7pz74na430";
import brandWordmark from "@/assets/brand.svg";

/**
 * LumaSkin splash lockup.
 *
 * The wordmark used to be live text in "Notable" + "Helvetica Neue Thin".
 * Neither family is available on the open web (Helvetica Neue ships only on
 * Apple devices), so it is rendered from the original Figma vector export
 * instead — pixel-identical everywhere, no webfont to wait on.
 * Metrics (125x116.5 mark, 19px gap, 91px wordmark) are measured off the
 * original Figma frame.
 */
export default function Frame() {
  return (
    <div className="content-stretch flex flex-col gap-[19px] items-center justify-center relative size-full">
      <div className="h-[116.5px] relative shrink-0 w-[125px]" data-name="Vector">
        <svg className="absolute block inset-0 size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 125 116.5">
          <g id="Vector">
            <path d={svgPaths.p11d92200} fill="url(#paint0_linear_1_1835)" />
            <path d={svgPaths.p173e1f80} fill="url(#paint1_linear_1_1835)" />
            <path d={svgPaths.pb6e5bf0} fill="url(#paint2_linear_1_1835)" />
          </g>
          <defs>
            <linearGradient gradientUnits="userSpaceOnUse" id="paint0_linear_1_1835" x1="9.5" x2="125" y1="77.8368" y2="49.3368">
              <stop stopColor="#C9D6FF" />
              <stop offset="1" stopColor="#8DADFA" />
            </linearGradient>
            <linearGradient gradientUnits="userSpaceOnUse" id="paint1_linear_1_1835" x1="9.5" x2="125" y1="77.8368" y2="49.3368">
              <stop stopColor="#C9D6FF" />
              <stop offset="1" stopColor="#8DADFA" />
            </linearGradient>
            <linearGradient gradientUnits="userSpaceOnUse" id="paint2_linear_1_1835" x1="9.5" x2="125" y1="77.8368" y2="49.3368">
              <stop stopColor="#C9D6FF" />
              <stop offset="1" stopColor="#8DADFA" />
            </linearGradient>
          </defs>
        </svg>
      </div>
      <img src={brandWordmark} alt="LumaSkin" className="relative shrink-0 w-[91px]" />
    </div>
  );
}
