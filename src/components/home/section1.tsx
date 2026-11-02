import { type InkSegment, ScrollInk } from "@/components/home/scroll-ink";
import { TicketPull } from "@/components/home/ticket-pull";
import { LandingAvatarIcon } from "@/lib/svgs";

const copy: InkSegment[] = [
  {
    text: "Cheq lets you trade against your friends on market trends, ",
    strong: true,
  },
  { text: "not against the market. A " },
  { text: "product made ", strong: true },
  {
    element: (
      <span className="relative -top-1 inline-block">
        <LandingAvatarIcon />
      </span>
    ),
  },
  { text: " for putting the " },
  { text: "fun into crypto.", strong: true },
];

const Section1 = () => {
  return (
    <section className="max-w-287.75 mx-auto mt-65 mb-63 font-monument">
      {/* The ticket flows inline after the text, so the type styles live on a div:
          the ticket is built from divs, which can't sit inside a <p> */}
      <ScrollInk
        segments={copy}
        className="text-display leading-17 tracking-[-2.2%] font-normal"
      >
        {" "}
        <span className="inline-block relative top-4">
          <TicketPull />
        </span>
      </ScrollInk>
    </section>
  );
};

export default Section1;
