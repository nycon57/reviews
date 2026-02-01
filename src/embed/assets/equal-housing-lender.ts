/**
 * Equal Housing Lender logo as inline SVG string.
 * Inlined to avoid additional network requests in the embed script.
 */

/**
 * Creates an inline SVG element for the Equal Housing Lender logo.
 * Returns a standalone SVG element that can be appended to any container.
 */
export function createEqualHousingLenderSVG(size = 20): SVGElement {
  const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  svg.setAttribute("viewBox", "0 0 24 24");
  svg.setAttribute("fill", "currentColor");
  svg.setAttribute("aria-hidden", "true");
  svg.setAttribute("class", "rw-ehl-icon");
  svg.style.width = `${size}px`;
  svg.style.height = `${size}px`;
  svg.style.flexShrink = "0";

  // House outline path (simplified Equal Housing Lender icon)
  const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
  path.setAttribute(
    "d",
    "M12 3L2 12h3v8h6v-6h2v6h6v-8h3L12 3zm0 2.84L19 12.5V19h-4v-6H9v6H5v-6.5L12 5.84z"
  );
  svg.appendChild(path);

  // "=" symbol inside the house (equal housing)
  const equal1 = document.createElementNS("http://www.w3.org/2000/svg", "rect");
  equal1.setAttribute("x", "9");
  equal1.setAttribute("y", "10");
  equal1.setAttribute("width", "6");
  equal1.setAttribute("height", "1.2");
  equal1.setAttribute("rx", "0.3");
  svg.appendChild(equal1);

  const equal2 = document.createElementNS("http://www.w3.org/2000/svg", "rect");
  equal2.setAttribute("x", "9");
  equal2.setAttribute("y", "12.5");
  equal2.setAttribute("width", "6");
  equal2.setAttribute("height", "1.2");
  equal2.setAttribute("rx", "0.3");
  svg.appendChild(equal2);

  return svg;
}

/**
 * Creates a house icon SVG for the First-Time Homebuyer badge.
 */
export function createHouseIconSVG(size = 12): SVGElement {
  const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  svg.setAttribute("viewBox", "0 0 24 24");
  svg.setAttribute("fill", "currentColor");
  svg.setAttribute("aria-hidden", "true");
  svg.setAttribute("class", "rw-house-icon");
  svg.style.width = `${size}px`;
  svg.style.height = `${size}px`;
  svg.style.flexShrink = "0";

  const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
  path.setAttribute("d", "M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z");
  svg.appendChild(path);

  return svg;
}
