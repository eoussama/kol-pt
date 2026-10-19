import { render } from "@testing-library/react";
import Loader from "./Loader";



/**
 * @description
 * Renders the loader and returns its skeleton element.
 *
 * @param props - The loader's props
 * @returns The skeleton element
 */
function renderLoader(props: Parameters<typeof Loader>[0] = {}): HTMLElement {
  return render(<Loader {...props} />).container.firstElementChild as HTMLElement;
}

describe("loader", () => {
  it("fills its container by default, with rounded corners", () => {
    const loader = renderLoader();

    expect(loader).toHaveStyle({ width: "100%", height: "100%" });
    expect(loader).toHaveClass("rounded-lg");
    expect(loader).not.toHaveClass("rounded-none");
    expect(loader).not.toHaveClass("absolute");
  });

  it("takes the given size", () => {
    expect(renderLoader({ width: "48px", height: "20px" })).toHaveStyle({ width: "48px", height: "20px" });
  });

  it("drops its rounded corners when flat", () => {
    expect(renderLoader({ flat: true })).toHaveClass("rounded-none");
  });

  it("covers its parent when overlaid", () => {
    expect(renderLoader({ overlay: true })).toHaveClass("absolute", "inset-0");
  });
});
